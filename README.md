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
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-firmware-quota"]
}
```

## Configuration

Connect your Firmware account using the `/connect` command in OpenCode:

```
/connect
```

Search for **Firmware** and enter your API key from [app.firmware.ai](https://app.firmware.ai).

OpenCode handles secure storage of your API key. This plugin only accesses it to make direct requests to Firmware's quota API endpoint—nothing else. The code is [open-source](https://github.com/alnandr/opencode-firmware-quota) and can be reviewed to verify this.

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

## License

MIT
