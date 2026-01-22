# opencode-firmware-quota

OpenCode plugin for monitoring your [Firmware](https://firmware.ai) API quota usage.

## Features

- **`firmware_quota` tool** - AI can check your quota on demand
- **`/usage` command** - Quick quota check via slash command
- **Auto-show on session start** - See your quota when starting a new session
- **Low quota warnings** - Get notified when usage exceeds 75% or 90%

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-firmware-quota"]
}
```

## Prerequisites

Connect your Firmware account using the `/connect` command in OpenCode:

```
/connect
```

Search for **Firmware** and enter your API key from [app.firmware.ai](https://app.firmware.ai).

## Usage

### Slash Command

```
/usage
```

Shows a toast notification with your current quota usage.

### AI Tool

Ask the AI to check your quota:

```
Check my Firmware quota
```

### Automatic Notifications

- **Session start**: Quota is displayed when you start a new session
- **Low quota (75%+)**: Warning notification shown
- **Critical quota (90%+)**: Error notification shown

## Configuration

The plugin reads your Firmware API key from:

1. `FIRMWARE_API_KEY` environment variable (if set)
2. OpenCode auth storage (`~/.local/share/opencode/auth.json`)

No additional configuration is required if you've connected Firmware via `/connect`.

## License

MIT
