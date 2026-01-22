import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"

// Types for Firmware API response
interface QuotaResponse {
  used: number
  reset: string | null
}

interface QuotaInfo {
  usedPercent: number
  resetTime: string | null
  isLow: boolean
  isCritical: boolean
}

// Configuration
const LOW_QUOTA_THRESHOLD = 75 // Show warning at 75%
const CRITICAL_QUOTA_THRESHOLD = 90 // Show critical warning at 90%

/**
 * Get the Firmware API key from environment or OpenCode auth storage
 */
function getFirmwareApiKey(): string | null {
  // Try environment variable first
  if (process.env.FIRMWARE_API_KEY) {
    return process.env.FIRMWARE_API_KEY
  }

  // Fall back to OpenCode auth storage
  const authPath = join(homedir(), ".local", "share", "opencode", "auth.json")
  try {
    const auth = JSON.parse(readFileSync(authPath, "utf-8"))
    if (auth.firmware?.key) {
      return auth.firmware.key
    }
  } catch {
    // File doesn't exist or is invalid
  }

  return null
}

/**
 * Fetch quota information from Firmware API
 */
async function fetchQuota(apiKey: string): Promise<QuotaResponse> {
  const response = await fetch("https://app.firmware.ai/api/v1/quota", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }

  return response.json() as Promise<QuotaResponse>
}

/**
 * Parse quota response into usable info
 */
function parseQuotaInfo(data: QuotaResponse): QuotaInfo {
  const usedPercent = Math.round(data.used * 100)

  let resetTime: string | null = null
  if (data.reset) {
    const resetDate = new Date(data.reset)
    resetTime = resetDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })
  }

  return {
    usedPercent,
    resetTime,
    isLow: usedPercent >= LOW_QUOTA_THRESHOLD,
    isCritical: usedPercent >= CRITICAL_QUOTA_THRESHOLD,
  }
}

/**
 * Format quota info as a display message
 */
function formatQuotaMessage(info: QuotaInfo): string {
  const resetPart = info.resetTime ? `Resets at ${info.resetTime}` : "No active window"

  if (info.isCritical) {
    return `Firmware: ${info.usedPercent}% used (CRITICAL) | ${resetPart}`
  } else if (info.isLow) {
    return `Firmware: ${info.usedPercent}% used (LOW) | ${resetPart}`
  }
  return `Firmware: ${info.usedPercent}% used | ${resetPart}`
}

/**
 * OpenCode plugin for Firmware API quota monitoring
 *
 * Features:
 * - firmware_quota tool: Check quota on demand via AI
 * - Auto-show quota on session start
 * - Low quota warnings when usage exceeds thresholds
 */
export const FirmwareQuotaPlugin: Plugin = async ({ client }) => {
  /**
   * Core function to check and display quota
   */
  async function checkQuota(options: { showToast?: boolean; silent?: boolean } = {}): Promise<string> {
    const { showToast = true, silent = false } = options

    const apiKey = getFirmwareApiKey()
    if (!apiKey) {
      const errorMsg = "Firmware API key not found. Run /connect and add your Firmware credentials."
      if (showToast && !silent) {
        await client.tui.showToast({
          body: { message: "Firmware not connected. Run /connect", variant: "error" },
        })
      }
      return `Error: ${errorMsg}`
    }

    try {
      const data = await fetchQuota(apiKey)
      const info = parseQuotaInfo(data)
      const message = formatQuotaMessage(info)

      if (showToast) {
        const variant = info.isCritical ? "error" : info.isLow ? "warning" : "info"
        await client.tui.showToast({
          body: { message, variant },
        })
      }

      return message
    } catch (err) {
      const error = err as Error
      const errorMsg = `Quota fetch failed: ${error.message}`
      if (showToast && !silent) {
        await client.tui.showToast({
          body: { message: errorMsg, variant: "error" },
        })
      }
      return `Error: ${errorMsg}`
    }
  }

  /**
   * Check if Firmware is connected (has API key)
   */
  function isFirmwareConnected(): boolean {
    return getFirmwareApiKey() !== null
  }

  return {
    // Tool: firmware_quota - Check quota on demand via AI tool call
    tool: {
      firmware_quota: {
        description: "Check your Firmware API quota usage",
        args: {},
        async execute() {
          return checkQuota()
        },
      },
    },

    // Event handlers
    event: async ({ event }) => {
      // Auto-show quota on session start (only if Firmware is connected)
      if (event.type === "session.created") {
        if (isFirmwareConnected()) {
          // Small delay to let the UI settle
          setTimeout(async () => {
            await checkQuota({ showToast: true })
          }, 500)
        }
      }

      // Low quota warning when session becomes idle (after AI response)
      // This is a good time to check quota without being too intrusive
      if (event.type === "session.idle") {
        if (isFirmwareConnected()) {
          try {
            const apiKey = getFirmwareApiKey()
            if (apiKey) {
              const data = await fetchQuota(apiKey)
              const info = parseQuotaInfo(data)

              // Only show warning if quota is low/critical
              if (info.isCritical) {
                await client.tui.showToast({
                  body: {
                    message: `Warning: Firmware quota at ${info.usedPercent}%!`,
                    variant: "error",
                  },
                })
              } else if (info.isLow) {
                await client.tui.showToast({
                  body: {
                    message: `Notice: Firmware quota at ${info.usedPercent}%`,
                    variant: "warning",
                  },
                })
              }
            }
          } catch {
            // Silently ignore errors during background checks
          }
        }
      }
    },
  }
}

// Default export for convenience
export default FirmwareQuotaPlugin
