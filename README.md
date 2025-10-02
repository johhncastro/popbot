# 🤖 PopBot 
A Discord bot built with Node.js and TypeScript that provides cryptocurrency prices, fun games, and website monitoring (more coming soon!).

## ✨ Features

- 💰 **Crypto Prices** - Real-time cryptocurrency prices from CoinGecko
- 🎰 **Roulette Wheel** - Animated spinning wheel for random selection
- 🌐 **Website Monitoring** - Monitor websites and get alerts when they go down (Admin Only)
- 📺 **Twitch Notifications** - Get notified when streamers go live (Admin Only)
- 🔧 **Status Checking** - Check monitoring service status and health (Admin Only)
- ⚡ **Fast & Reliable** - Built with TypeScript and modern Discord.js

## 🚀 Quick Start

### 1. 🔧 Setup Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy your bot token and client ID
4. Add bot to your server with `applications.commands` scope

### 2. 📦 Install & Run

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your Discord and Twitch credentials to .env

# Deploy commands
npm run deploy:global

# Start the bot
npm run dev
```

## 📋 Commands

### 🌍 Public Commands
- 💰 `/price symbol:btc` - Get single cryptocurrency price
- 📊 `/prices symbols:btc,eth,sol` - Get multiple cryptocurrency prices
- 🎰 `/roulette options:"Game 1,Game 2,Game 3"` - Spin the roulette wheel
- ❓ `/help` - Get help and information about all commands

### 🔒 Admin Commands (Requires Administrator Permission)
- 🌐 `/monitor url:https://example.com channel:#alerts` - Monitor a website
- 🔧 `/status` - Check monitoring service status
- 📺 `/twitch-add username:streamer channel:#live` - Add Twitch streamer for live notifications
- 🗑️ `/twitch-remove username:streamer` - Remove Twitch streamer from notifications
- 📋 `/twitch-list` - List all monitored Twitch streamers

## 🎰 Roulette Examples

```
/roulette options:"Minecraft,Fortnite,Among Us,Valorant"
/roulette options:"Alice,Bob,Charlie,David"
/roulette options:"Pizza,Burger,Sushi,Tacos"
```

## 🌐 Website Monitoring (Admin Only)

Monitor your websites and get instant alerts when they go down:

```
/monitor url:https://kawaiiscan.com channel:#alerts interval:5 start:true
```

**Note:** Requires Administrator permissions to use monitoring commands.

## 📺 Twitch Live Notifications (Admin Only)

Get notified when your favorite streamers go live:

```
/twitch-add username:ninja channel:#live
/twitch-add username:shroud channel:#notifications
/twitch-list
```

**Note:** Requires Administrator permissions to manage Twitch notifications.

## 🐳 Docker Deployment

```bash
# Build and run with Docker
docker-compose up -d
```

**Note:** Discord bots don't need exposed ports - they connect to Discord's servers, not run web servers.

## 📄 License

MIT License - feel free to use for your own projects!

