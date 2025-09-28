# 🤖 PopBot 
A Discord bot built with Node.js and TypeScript that provides cryptocurrency prices, fun games, and website monitoring (more coming soon!).

## ✨ Features

- 💰 **Crypto Prices** - Real-time cryptocurrency prices from CoinGecko
- 🎰 **Roulette Wheel** - Animated spinning wheel for random selection
- 🌐 **Website Monitoring** - Monitor websites and get alerts when they go down
- 🔧 **Status Checking** - Check monitoring service status and health
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
cp env.example .env
# Add your Discord credentials to .env

# Deploy commands
npm run deploy:global

# Start the bot
npm run dev
```

## 📋 Commands

- 💰 `/price symbol:btc` - Get single cryptocurrency price
- 📊 `/prices symbols:btc,eth,sol` - Get multiple cryptocurrency prices
- 🎰 `/roulette options:"Game 1,Game 2,Game 3"` - Spin the roulette wheel
- 🌐 `/monitor url:https://example.com channel:#alerts` - Monitor a website
- 🔧 `/status` - Check monitoring service status

## 🎰 Roulette Examples

```
/roulette options:"Minecraft,Fortnite,Among Us,Valorant"
/roulette options:"Alice,Bob,Charlie,David"
/roulette options:"Pizza,Burger,Sushi,Tacos"
```

## 🌐 Website Monitoring

Monitor your websites and get instant alerts:

```
/monitor url:https://kawaiiscan.com channel:#alerts interval:5 start:true
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker
docker-compose up -d
```

## 📄 License

MIT License - feel free to use for your own projects!

