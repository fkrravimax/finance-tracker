import * as dotenv from 'dotenv';
dotenv.config();

const CMC_API_KEY = process.env.CMC_API_KEY || '';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com';

// --- In-memory cache ---
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};

function getCached<T>(key: string, ttlMs: number): T | null {
    const entry = cache[key];
    if (entry && Date.now() - entry.timestamp < ttlMs) {
        return entry.data as T;
    }
    return null;
}

function setCache<T>(key: string, data: T): void {
    cache[key] = { data, timestamp: Date.now() };
}

// TTL constants
const CACHE_TTL = {
    LISTINGS: 5 * 60 * 1000,      // 5 minutes
    GLOBAL: 5 * 60 * 1000,        // 5 minutes
    QUOTES: 3 * 60 * 1000,        // 3 minutes
    INFO: 60 * 60 * 1000,         // 1 hour (static data)
    CONVERSION: 3 * 60 * 1000,    // 3 minutes
};

async function cmcFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${CMC_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const response = await fetch(url.toString(), {
        headers: {
            'X-CMC_PRO_API_KEY': CMC_API_KEY,
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CMC API error (${response.status}): ${errorText}`);
    }

    return response.json();
}

export const cryptoService = {
    /**
     * Get latest crypto listings (top N by market cap)
     */
    async getListings(limit: number = 50, convert: string = 'USD') {
        const cacheKey = `listings_${limit}_${convert}`;
        const cached = getCached(cacheKey, CACHE_TTL.LISTINGS);
        if (cached) return cached;

        const result = await cmcFetch('/v1/cryptocurrency/listings/latest', {
            limit: limit.toString(),
            convert,
            sort: 'market_cap',
            sort_dir: 'desc',
        });

        const data = result.data?.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            slug: coin.slug,
            cmc_rank: coin.cmc_rank,
            circulating_supply: coin.circulating_supply,
            total_supply: coin.total_supply,
            max_supply: coin.max_supply,
            price: coin.quote?.[convert]?.price,
            volume_24h: coin.quote?.[convert]?.volume_24h,
            volume_change_24h: coin.quote?.[convert]?.volume_change_24h,
            percent_change_1h: coin.quote?.[convert]?.percent_change_1h,
            percent_change_24h: coin.quote?.[convert]?.percent_change_24h,
            percent_change_7d: coin.quote?.[convert]?.percent_change_7d,
            market_cap: coin.quote?.[convert]?.market_cap,
            fully_diluted_market_cap: coin.quote?.[convert]?.fully_diluted_market_cap,
            last_updated: coin.quote?.[convert]?.last_updated,
        })) || [];

        setCache(cacheKey, data);
        return data;
    },

    /**
     * Get global market metrics
     */
    async getGlobalMetrics(convert: string = 'USD') {
        const cacheKey = `global_${convert}`;
        const cached = getCached(cacheKey, CACHE_TTL.GLOBAL);
        if (cached) return cached;

        const result = await cmcFetch('/v1/global-metrics/quotes/latest', { convert });

        const d = result.data;
        const data = {
            total_cryptocurrencies: d.total_cryptocurrencies,
            total_exchanges: d.total_exchanges,
            active_cryptocurrencies: d.active_cryptocurrencies,
            active_exchanges: d.active_exchanges,
            btc_dominance: d.btc_dominance,
            eth_dominance: d.eth_dominance,
            defi_volume_24h: d.defi_volume_24h,
            defi_market_cap: d.defi_market_cap,
            total_market_cap: d.quote?.[convert]?.total_market_cap,
            total_volume_24h: d.quote?.[convert]?.total_volume_24h,
            total_market_cap_yesterday_percentage_change: d.quote?.[convert]?.total_market_cap_yesterday_percentage_change,
            total_volume_24h_yesterday_percentage_change: d.quote?.[convert]?.total_volume_24h_yesterday_percentage_change,
            last_updated: d.last_updated,
        };

        setCache(cacheKey, data);
        return data;
    },

    /**
     * Get latest quotes for specific symbols (comma-separated)
     */
    async getQuotes(symbols: string, convert: string = 'USD') {
        const cacheKey = `quotes_${symbols}_${convert}`;
        const cached = getCached(cacheKey, CACHE_TTL.QUOTES);
        if (cached) return cached;

        const result = await cmcFetch('/v2/cryptocurrency/quotes/latest', {
            symbol: symbols.toUpperCase(),
            convert,
        });

        // v2 returns data keyed by symbol, each symbol has an array
        const data: Record<string, any> = {};
        if (result.data) {
            for (const [symbol, coins] of Object.entries(result.data)) {
                const coinArray = coins as any[];
                const coin = coinArray[0]; // Take first match
                if (coin) {
                    data[symbol] = {
                        id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol,
                        slug: coin.slug,
                        cmc_rank: coin.cmc_rank,
                        circulating_supply: coin.circulating_supply,
                        price: coin.quote?.[convert]?.price,
                        volume_24h: coin.quote?.[convert]?.volume_24h,
                        percent_change_1h: coin.quote?.[convert]?.percent_change_1h,
                        percent_change_24h: coin.quote?.[convert]?.percent_change_24h,
                        percent_change_7d: coin.quote?.[convert]?.percent_change_7d,
                        market_cap: coin.quote?.[convert]?.market_cap,
                        last_updated: coin.quote?.[convert]?.last_updated,
                    };
                }
            }
        }

        setCache(cacheKey, data);
        return data;
    },

    /**
     * Get crypto info/metadata (logos, descriptions, urls)
     */
    async getInfo(symbols: string) {
        const cacheKey = `info_${symbols}`;
        const cached = getCached(cacheKey, CACHE_TTL.INFO);
        if (cached) return cached;

        const result = await cmcFetch('/v2/cryptocurrency/info', {
            symbol: symbols.toUpperCase(),
        });

        const data: Record<string, any> = {};
        if (result.data) {
            for (const [symbol, coins] of Object.entries(result.data)) {
                const coinArray = coins as any[];
                const coin = coinArray[0];
                if (coin) {
                    data[symbol] = {
                        id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol,
                        slug: coin.slug,
                        logo: coin.logo,
                        description: coin.description,
                        category: coin.category,
                        urls: coin.urls,
                        tags: coin.tags?.slice(0, 10),
                        date_added: coin.date_added,
                    };
                }
            }
        }

        setCache(cacheKey, data);
        return data;
    },

    /**
     * Convert price between currencies
     */
    async convertPrice(amount: number, symbol: string, convert: string = 'IDR') {
        const cacheKey = `convert_${amount}_${symbol}_${convert}`;
        const cached = getCached(cacheKey, CACHE_TTL.CONVERSION);
        if (cached) return cached;

        const result = await cmcFetch('/v1/tools/price-conversion', {
            amount: amount.toString(),
            symbol: symbol.toUpperCase(),
            convert,
        });

        const d = result.data;
        const data = {
            id: d.id,
            symbol: d.symbol,
            name: d.name,
            amount: d.amount,
            last_updated: d.last_updated,
            converted_price: d.quote?.[convert]?.price,
            converted_currency: convert,
        };

        setCache(cacheKey, data);
        return data;
    },

    /**
     * Get CoinMarketCap ID map
     */
    async getMap(limit: number = 200) {
        const cacheKey = `map_${limit}`;
        const cached = getCached(cacheKey, CACHE_TTL.INFO);
        if (cached) return cached;

        const result = await cmcFetch('/v1/cryptocurrency/map', {
            limit: limit.toString(),
            sort: 'cmc_rank',
        });

        const data = result.data?.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            slug: coin.slug,
            rank: coin.rank,
            is_active: coin.is_active,
        })) || [];

        setCache(cacheKey, data);
        return data;
    },


    /**
     * Get Bitcoin Fear and Greed Index from Alternative.me
     */
    async getFearGreedIndex() {
        const cacheKey = 'fear_greed_index';
        const cached = getCached(cacheKey, CACHE_TTL.GLOBAL); // Cache for 5 mins
        if (cached) return cached;

        try {
            const response = await fetch('https://api.alternative.me/fng/?limit=1');
            if (!response.ok) throw new Error('Failed to fetch Fear & Greed Index');

            const result = await response.json();
            const data = result.data?.[0] || null;

            if (data) {
                setCache(cacheKey, data);
            }
            return data;
        } catch (error) {
            console.error('Fear & Greed API Error:', error);
            return null;
        }
    }
};
