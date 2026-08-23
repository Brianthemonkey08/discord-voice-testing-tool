#
# K9K v2 - Multi-Account System
#

# 🚫 TOOL USAGE RESTRICTION

## ⚠️ DISCORD TERMS OF SERVICE COMPLIANCE WARNING ⚠️

** THIS PROJECT VIOLATES DISCORD TERMS OF SERVICE IF USED IMPROPERLY **

**This project utilizes Self-bot technology which is explicitly prohibited by Discord's Terms of Service.**

**⚠️ CRITICAL WARNING: ⚠️**

- **Self-bots are banned on sight** - Discord's ToS Section 4.3 states: "You agree not to access the Services through automated means"
- **Account termination risk** - Using self-bots can result in permanent account deletion
- **No warranty** - This code is provided "as is" without any guarantee of compliance
- **User responsibility** - YOU are solely responsible for how this code is used

**I am not responsible for any consequences:** This code is provided for educational and testing purposes only. I do not endorse or encourage violation of Discord's ToS. By using this code, you acknowledge:
1. You understand the risks of account suspension/ban
2. You accept full responsibility for any actions taken with this code
3. You will not hold the author responsible for account bans or terminations

**Permitted use only:** This code is intended for:
- Local testing and development
- Educational purposes
- Understanding Discord API limitations
- Personal research only

**Distribution warning:** Sharing, selling, or using this code in production bots violates this repository's license and Discord's ToS.

---

# 📢 IMPORTANT NOTICE

**This project is intended for testing and development purposes only** - **For testing and development purposes only**.

⚠️ **Important Warning:** Using this code for public Discord bots or distributing it outside local testing environment violates **Discord Terms of Service (ToS)**.

**I am not responsible for any misuse:** This code is provided for local testing purposes only, and I am not responsible for:
- Account bans
- Discord account suspensions  
- Any legal or technical issues resulting from improper use

## 📝 Description

**K9K v2** is a **local stress and voice testing tool** designed for **developers** to test **Discord voice bots** using a **multi-account system** with a **web dashboard**.

**⚠️ Notice:** This code uses Self-bot technology which is prohibited by Discord, and it is **strictly for local testing only**.

## 🎯 Use Cases / Purpose

| Use Case | Description |
|----------|-------------|
| **Voice Latency Testing** | Measure bot response times in voice channels |
| **Load Testing** | Test bot stability under multiple concurrent connections |
| **Stress Testing** | Evaluate system performance with maximum account limits |
| **Multi-account Management** | Monitor and control up to 5 simultaneous bot accounts |
| **Dashboard Monitoring** | Real-time web interface for account status and resource usage |

## 🛠️ Prerequisites

- **Operating System:** Windows OS or Linux OS (for PC or VPS/Hosting)
- **Runtime:** Node.js version 16 or higher
- **Configuration:** `config.json` file with token settings
- **Tools:** Basic knowledge of Terminal/Command Prompt

## 📦 Installation

### 🖥️ PC Installation

| Step | Command/Action |
|------|----------------|
| **1. Download files** | `git clone [repository-name]` or download ZIP |
| **2. Install dependencies** | `npm install` |
| **3. Configure tokens** | Edit `config.json` (see config model below) |
| **4. Run the script** | `node index.js` or double-click `run.bat` |

### 🌐 VPS / Hosting Installation

| Step | Command/Action |
|------|----------------|
| **1. Upload files** | Upload all project files to your hosting (cPanel, VPS, or any hosting service) |
| **2. Install dependencies** | `npm install --production` |
| **3. Configure files** | Edit `config.json` according to your needs |
| **4. Run continuously** | `pm2 start index.js` <br>Or add to Cron Job for auto-restart |

## ⚙️ Configuration Model (`config.json`)

Below is the code model for your `config.json` file showing all required variables:

```json
{
  "webhookUrl": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",
  "restartHours": 0,              // 0 = Disable time-based restart, keep only RAM restart
  "maxRamMB": 512,                // RAM limit in MB (default: 512 MB)
  "dashboardPort": 3000,          // Web dashboard port
  "maxAccounts": 5,               // Maximum number of accounts to process (MAX_ACCOUNTS)
  "accounts": [
    {
      "name": "Unit-01",
      "token": "YOUR_TOKEN_HERE",
      "guildId": "GUILD_ID_HERE",
      "channelId": "CHANNEL_ID_HERE",
      "mute": true,
      "deaf": true
    },
    {
      "name": "Unit-02",
      "token": "YOUR_TOKEN_HERE",
      "guildId": "GUILD_ID_HERE",
      "channelId": "CHANNEL_ID_HERE",
      "mute": true,
      "deaf": true
    }
    // ... add up to 5 accounts maximum
  ]
}
```

### Configuration Variables Explained:

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `maxRamMB` | number | RAM limit in MB before auto-restart | `512` |
| `dashboardPort` | number | Port for the web dashboard | `3000` |
| `maxAccounts` | number | Maximum accounts to process simultaneously | `5` |
| `accounts[].name` | string | Display name for each account | - |
| `accounts[].token` | string | Discord token for the account | required |
| `accounts[].guildId` | string | Discord server ID | required |
| `accounts[].channelId` | string | Voice channel ID | required |
| `accounts[].mute` | boolean | Self-mute status | `true` |
| `accounts[].deaf` | boolean | Self-deaf status | `true` |
| `restartHours` | number | Hours between auto-restarts (0 = disabled) | `0` |

## 📊 Control Panel States Table

| Status | Emoji | Description |
|--------|-------|-------------|
| **Connected** | ✅ | Bot is connected to voice channel and running |
| **Connecting** | 🔄 | Bot is attempting to connect to voice channel |
| **Stopped** | ⛔ | Bot has been stopped or manually disconnected |

## 💻 How It Works

1. **Account Processing:** Script processes maximum **5 accounts** (configurable via `MAX_ACCOUNTS` variable)
2. **Voice Connection:** Each bot attempts to connect to configured voice channels
3. **Monitoring:** Real-time dashboard at `http://localhost:3000` (PC) or `your-ip:3000` (Hosting)
4. **Resource Management:** Monitors RAM usage and auto-restarts if limit exceeded (default 512 MB)
5. **Status Tracking:** Each unit shows status: **Connected**, **Connecting**, or **Stopped**

## 📞 Support

📞 **Support:** https://discord.gg/wxkxHmR9GT

👤 **My Discord:** r.vu

⚡ **If you find any issue in the code or have any questions, feel free to contact me for support or inquiries.**

---

**Disclaimer:** This tool is for testing and development purposes only. Use of voice bots must comply with Discord's service policies and terms. I am not responsible for any bans or issues arising from misuse.

---

## ✨ Summary

**K9K v2** = Advanced local testing tool for Discord voice bots with multi-account support, RAM monitoring, and web dashboard. **Use responsibly** and only for development purposes. Always comply with Discord's Terms of Service.