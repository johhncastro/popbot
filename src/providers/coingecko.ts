export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  source: string;
  fetchedAt: Date;
}

export interface PriceProvider {
  getPrices(symbols: string[], vs: string): Promise<PriceData[]>;
}

export class CoinGeckoProvider implements PriceProvider {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly symbolMap: Record<string, string> = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    'ada': 'cardano',
    'dot': 'polkadot',
    'matic': 'matic-network',
    'avax': 'avalanche-2',
    'link': 'chainlink',
    'atom': 'cosmos',
    'near': 'near',
    'ftm': 'fantom',
    'algo': 'algorand',
    'vet': 'vechain',
    'icp': 'internet-computer',
    'fil': 'filecoin',
    'trx': 'tron',
    'xlm': 'stellar',
    'hbar': 'hedera-hashgraph',
    'egld': 'elrond-erd-2',
    'xtz': 'tezos',
    'mana': 'decentraland',
    'sand': 'the-sandbox',
    'axs': 'axie-infinity',
    'chz': 'chiliz',
    'enj': 'enjincoin',
    'flow': 'flow',
    'theta': 'theta-token',
    'klay': 'klaytn',
    'eos': 'eos',
    'xrp': 'ripple',
    'ltc': 'litecoin',
    'bch': 'bitcoin-cash',
    'xmr': 'monero',
    'dash': 'dash',
    'zec': 'zcash',
    'doge': 'dogecoin',
    'shib': 'shiba-inu',
    'pepe': 'pepe',
    'floki': 'floki',
    'bonk': 'bonk',
    'wld': 'worldcoin-wld',
    'arb': 'arbitrum',
    'op': 'optimism',
    'inj': 'injective-protocol',
    'sei': 'sei-network',
    'sui': 'sui',
    'apt': 'aptos',
    'tia': 'celestia',
    'rndr': 'render-token',
    'fet': 'fetch-ai',
    'agix': 'singularitynet',
    'ocean': 'ocean-protocol',
    'grt': 'the-graph',
    'lido': 'lido-dao',
    'crv': 'curve-dao-token',
    'comp': 'compound-governance-token',
    'aave': 'aave',
    'mkr': 'maker',
    'snx': 'havven',
    'uni': 'uniswap',
    '1inch': '1inch',
    'sushi': 'sushiswap',
    'cake': 'pancakeswap-token',
    'gmx': 'gmx',
    'dydx': 'dydx',
    'perp': 'perpetual-protocol',
    'gno': 'gnosis',
    'bal': 'balancer',
    'yfi': 'yearn-finance',
    'badger': 'badger-dao',
    'pickle': 'pickle-finance',
    'harvest': 'harvest-finance',
    'cream': 'cream-2',
    'alpha': 'alpha-finance',
    'bnt': 'bancor',
    'knc': 'kyber-network-crystal',
    'ren': 'republic-protocol',
    'rsr': 'reserve-rights-token',
    'lrc': 'loopring',
    'zrx': '0x',
    'bat': 'basic-attention-token',
    'zil': 'zilliqa',
    'qtum': 'qtum',
    'waves': 'waves',
    'neo': 'neo',
    'ont': 'ontology',
    'icx': 'icon',
    'zec': 'zcash',
    'dash': 'dash',
    'xmr': 'monero',
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'ltc': 'litecoin',
    'bch': 'bitcoin-cash',
    'xrp': 'ripple',
    'ada': 'cardano',
    'dot': 'polkadot',
    'sol': 'solana',
    'avax': 'avalanche-2',
    'matic': 'matic-network',
    'link': 'chainlink',
    'atom': 'cosmos',
    'near': 'near',
    'ftm': 'fantom',
    'algo': 'algorand',
    'vet': 'vechain',
    'icp': 'internet-computer',
    'fil': 'filecoin',
    'trx': 'tron',
    'xlm': 'stellar',
    'hbar': 'hedera-hashgraph',
    'egld': 'elrond-erd-2',
    'xtz': 'tezos',
  };

  async getPrices(symbols: string[], vs: string = 'usd'): Promise<PriceData[]> {
    try {
      // Normalize symbols to CoinGecko IDs
      const coinIds = symbols.map(symbol => {
        const normalized = symbol.toLowerCase().trim();
        return this.symbolMap[normalized] || normalized;
      });

      // Make API request
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${vs}&include_24hr_change=true&include_market_cap=true`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const results: PriceData[] = [];

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const coinId = coinIds[i];
        const coinData = data[coinId];

        if (!coinData) {
          // Symbol not found
          results.push({
            symbol: symbol.toUpperCase(),
            name: symbol,
            price: 0,
            change24h: 0,
            source: 'CoinGecko',
            fetchedAt: new Date(),
          });
          continue;
        }

        const price = coinData[vs] || 0;
        const change24h = coinData[`${vs}_24h_change`] || 0;
        const marketCap = coinData[`${vs}_market_cap`] || undefined;

        results.push({
          symbol: symbol.toUpperCase(),
          name: this.getCoinName(coinId),
          price,
          change24h,
          marketCap,
          source: 'CoinGecko',
          fetchedAt: new Date(),
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching prices from CoinGecko:', error);
      throw new Error('Failed to fetch price data');
    }
  }

  private getCoinName(coinId: string): string {
    // Convert coin ID to a more readable name
    const nameMap: Record<string, string> = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'solana': 'Solana',
      'cardano': 'Cardano',
      'polkadot': 'Polkadot',
      'matic-network': 'Polygon',
      'avalanche-2': 'Avalanche',
      'chainlink': 'Chainlink',
      'cosmos': 'Cosmos',
      'near': 'NEAR Protocol',
      'fantom': 'Fantom',
      'algorand': 'Algorand',
      'vechain': 'VeChain',
      'internet-computer': 'Internet Computer',
      'filecoin': 'Filecoin',
      'tron': 'TRON',
      'stellar': 'Stellar',
      'hedera-hashgraph': 'Hedera',
      'elrond-erd-2': 'MultiversX',
      'tezos': 'Tezos',
      'decentraland': 'Decentraland',
      'the-sandbox': 'The Sandbox',
      'axie-infinity': 'Axie Infinity',
      'chiliz': 'Chiliz',
      'enjincoin': 'Enjin Coin',
      'flow': 'Flow',
      'theta-token': 'Theta Network',
      'klaytn': 'Klaytn',
      'eos': 'EOS',
      'ripple': 'XRP',
      'litecoin': 'Litecoin',
      'bitcoin-cash': 'Bitcoin Cash',
      'monero': 'Monero',
      'dash': 'Dash',
      'zcash': 'Zcash',
      'dogecoin': 'Dogecoin',
      'shiba-inu': 'Shiba Inu',
      'pepe': 'Pepe',
      'floki': 'Floki',
      'bonk': 'Bonk',
      'worldcoin-wld': 'Worldcoin',
      'arbitrum': 'Arbitrum',
      'optimism': 'Optimism',
      'injective-protocol': 'Injective',
      'sei-network': 'Sei',
      'sui': 'Sui',
      'aptos': 'Aptos',
      'celestia': 'Celestia',
      'render-token': 'Render',
      'fetch-ai': 'Fetch.ai',
      'singularitynet': 'SingularityNET',
      'ocean-protocol': 'Ocean Protocol',
      'the-graph': 'The Graph',
      'lido-dao': 'Lido DAO',
      'curve-dao-token': 'Curve DAO Token',
      'compound-governance-token': 'Compound',
      'aave': 'Aave',
      'maker': 'Maker',
      'havven': 'Synthetix',
      'uniswap': 'Uniswap',
      '1inch': '1inch',
      'sushiswap': 'SushiSwap',
      'pancakeswap-token': 'PancakeSwap',
      'gmx': 'GMX',
      'dydx': 'dYdX',
      'perpetual-protocol': 'Perpetual Protocol',
      'gnosis': 'Gnosis',
      'balancer': 'Balancer',
      'yearn-finance': 'Yearn Finance',
      'badger-dao': 'Badger DAO',
      'pickle-finance': 'Pickle Finance',
      'harvest-finance': 'Harvest Finance',
      'cream-2': 'Cream Finance',
      'alpha-finance': 'Alpha Finance',
      'bancor': 'Bancor',
      'kyber-network-crystal': 'Kyber Network Crystal',
      'republic-protocol': 'Republic Protocol',
      'reserve-rights-token': 'Reserve Rights',
      'loopring': 'Loopring',
      '0x': '0x Protocol',
      'basic-attention-token': 'Basic Attention Token',
      'zilliqa': 'Zilliqa',
      'qtum': 'Qtum',
      'waves': 'Waves',
      'neo': 'NEO',
      'ontology': 'Ontology',
      'icon': 'ICON',
    };

    return nameMap[coinId] || coinId.charAt(0).toUpperCase() + coinId.slice(1);
  }
}

export const coingeckoProvider = new CoinGeckoProvider();
