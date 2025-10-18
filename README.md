# 🤖 PopBot 
A Discord bot built with Node.js and TypeScript that provides cryptocurrency prices, fun games, and website monitoring (more coming soon!).

## ✨ Features

- 💰 **Crypto Prices** - Real-time cryptocurrency prices from CoinGecko
- 🎰 **Roulette Wheel** - Animated spinning wheel for random selection
- 🎮 **Minecraft Search** - Look up player data, skins, capes, and name history
- 📝 **Minecraft Whitelist** - Add players to your Minecraft server whitelist
- 🌐 **Website Monitoring** - Monitor websites and get alerts when they go down (Admin Only)
- 📺 **Twitch Notifications** - Get notified when streamers go live (Admin Only)
- 📺 **YouTube Notifications** - Get notified when channels upload new videos (Admin Only)
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
# Add your Discord, Twitch, and YouTube credentials to .env

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
- 🎮 `/minecraftsearch username:player` - Search Minecraft player data
- 📝 `/whitelist username:yukmi` - Add a player to the Minecraft server whitelist
- ❓ `/help` - Get help and information about all commands

### 🔒 Admin Commands (Requires Administrator Permission)
- 🌐 `/monitor url:https://example.com channel:#alerts` - Monitor a website
- 🔧 `/status` - Check monitoring service status
- 📺 `/twitch-add username:streamer channel:#live` - Add Twitch streamer for live notifications
- 🗑️ `/twitch-remove username:streamer` - Remove Twitch streamer from notifications
- 📋 `/twitch-list` - List all monitored Twitch streamers
- 📺 `/youtube-add channel-id:UC_xxx channel:#videos` - Add YouTube channel for video notifications
- 🗑️ `/youtube-remove channel-id:UC_xxx` - Remove YouTube channel from notifications
- 📋 `/youtube-list` - List all monitored YouTube channels

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

## 📺 YouTube Video Notifications (Admin Only)

Get notified when your favorite YouTube channels upload new videos:

```
/youtube-add channel-id:UC_x5XG1OV2P6uZZ5FSM9Ttw channel:#videos
/youtube-add channel-id:UCBJycsmduvYEL83R_UopJ3Q channel:#notifications channel-name:Marques Brownlee
/youtube-list
```

**Features:**
- 🆓 **No API quota limits** - Uses YouTube RSS feeds (completely free!)
- ⚡ **Checks every 5 minutes** - Fast notifications for new uploads
- 🔑 **No API key required** - Works without YouTube Data API v3

**Note:** Requires Administrator permissions to manage YouTube notifications.

## 🎮 Minecraft Commands

### Minecraft Player Search

Look up Minecraft player information including skins, capes, and name history:

```
/minecraftsearch username:notch
/minecraftsearch username:dream
/minecraftsearch username:technoblade
```

### Minecraft Server Whitelist

Add players to your Minecraft server whitelist with automatic UUID lookup:

```
/whitelist username:yukmi
/whitelist username:notch
/whitelist username:dream
```

**Features:**
- ✅ **Automatic UUID Lookup** - Fetches player UUID from Mojang API
- 🔒 **Duplicate Prevention** - Won't add the same player twice
- ⚡ **Instant Updates** - Updates whitelist.json immediately
- 🎮 **Ready to Join** - Players can join the server right away

## 🐳 Docker Deployment

```bash
# Build and run with Docker
docker-compose up -d
```


## 📄 License

MIT License - feel free to use for your own projects!

