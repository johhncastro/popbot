import { EmbedBuilder, codeBlock } from 'discord.js';
import { PriceData } from '../providers/coingecko.js';
import { MAX_SYMBOLS_PER_REQUEST } from '../config.js';

export function formatPrice(price: number): string {
  if (price === 0) return 'N/A';
  
  if (price < 0.01) {
    return `$${price.toFixed(8)}`;
  } else if (price < 1) {
    return `$${price.toFixed(6)}`;
  } else if (price < 100) {
    return `$${price.toFixed(4)}`;
  } else if (price < 10000) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
}

export function formatChange(change: number): string {
  if (change === 0) return '0.00%';
  
  const sign = change > 0 ? '+' : '';
  const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
  return `${arrow} ${sign}${change.toFixed(2)}%`;
}

export function formatMarketCap(marketCap?: number): string {
  if (!marketCap || marketCap === 0) return 'N/A';
  
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  } else if (marketCap >= 1e3) {
    return `$${(marketCap / 1e3).toFixed(2)}K`;
  } else {
    return `$${marketCap.toFixed(2)}`;
  }
}

export function createPriceEmbed(priceData: PriceData, vs: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${priceData.symbol} / ${vs.toUpperCase()}`)
    .setColor(priceData.change24h >= 0 ? 0x00ff00 : 0xff0000)
    .addFields(
      {
        name: '💰 Price',
        value: formatPrice(priceData.price),
        inline: true,
      },
      {
        name: '📊 24h Change',
        value: formatChange(priceData.change24h),
        inline: true,
      },
      {
        name: '🏢 Market Cap',
        value: formatMarketCap(priceData.marketCap),
        inline: true,
      },
      {
        name: '📅 Updated',
        value: `<t:${Math.floor(priceData.fetchedAt.getTime() / 1000)}:R>`,
        inline: true,
      },
      {
        name: '🔗 Source',
        value: priceData.source,
        inline: true,
      }
    )
    .setTimestamp();

  return embed;
}

export function createPricesTable(priceDataList: PriceData[], vs: string): string {
  if (priceDataList.length === 0) {
    return 'No price data available.';
  }

  const header = 'Symbol | Price | 24h Change | Market Cap';
  const separator = '-------|-------|------------|------------';
  
  const rows = priceDataList.map(data => {
    const symbol = data.symbol.padEnd(6);
    const price = formatPrice(data.price).padEnd(8);
    const change = formatChange(data.change24h).padEnd(12);
    const marketCap = formatMarketCap(data.marketCap).padEnd(12);
    
    return `${symbol} | ${price} | ${change} | ${marketCap}`;
  });

  const table = [header, separator, ...rows].join('\n');
  return codeBlock('', table);
}

export function createPricesEmbeds(priceDataList: PriceData[], vs: string): EmbedBuilder[] {
  if (priceDataList.length === 0) {
    return [];
  }

  // If 3 or fewer symbols, create individual embeds
  if (priceDataList.length <= 3) {
    return priceDataList.map(data => createPriceEmbed(data, vs));
  }

  // For more than 3 symbols, create a single embed with a table
  const embed = new EmbedBuilder()
    .setTitle(`Crypto Prices (${vs.toUpperCase()})`)
    .setDescription(createPricesTable(priceDataList, vs))
    .setColor(0x0099ff)
    .setTimestamp()
    .setFooter({ text: `Data from ${priceDataList[0]?.source || 'CoinGecko'}` });

  return [embed];
}

export function parseSymbols(input: string): string[] {
  return input
    .split(',')
    .map(symbol => symbol.trim().toLowerCase())
    .filter(symbol => symbol.length > 0);
}

export function validateSymbols(symbols: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const symbol of symbols) {
    if (symbol.length >= 2 && symbol.length <= 10 && /^[a-z0-9]+$/.test(symbol)) {
      valid.push(symbol);
    } else {
      invalid.push(symbol);
    }
  }

  return { valid, invalid };
}

export function getHelpfulSymbols(): string[] {
  return [
    'btc', 'eth', 'sol', 'ada', 'dot', 'matic', 'avax', 'link', 'atom', 'near',
    'ftm', 'algo', 'vet', 'icp', 'fil', 'trx', 'xlm', 'hbar', 'egld', 'xtz',
    'mana', 'sand', 'axs', 'chz', 'enj', 'flow', 'theta', 'klay', 'eos', 'xrp',
    'ltc', 'bch', 'xmr', 'dash', 'zec', 'doge', 'shib', 'pepe', 'floki', 'bonk'
  ];
}
