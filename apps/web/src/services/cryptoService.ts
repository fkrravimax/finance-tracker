import api from './api';

export interface CryptoListing {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    cmc_rank: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    price: number;
    volume_24h: number;
    volume_change_24h: number;
    percent_change_1h: number;
    percent_change_24h: number;
    percent_change_7d: number;
    market_cap: number;
    fully_diluted_market_cap: number;
    last_updated: string;
}

export interface GlobalMetrics {
    total_cryptocurrencies: number;
    total_exchanges: number;
    active_cryptocurrencies: number;
    active_exchanges: number;
    btc_dominance: number;
    eth_dominance: number;
    defi_volume_24h: number;
    defi_market_cap: number;
    total_market_cap: number;
    total_volume_24h: number;
    total_market_cap_yesterday_percentage_change: number;
    total_volume_24h_yesterday_percentage_change: number;
    last_updated: string;
}

export interface CryptoQuote {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    cmc_rank: number;
    circulating_supply: number;
    price: number;
    volume_24h: number;
    percent_change_1h: number;
    percent_change_24h: number;
    percent_change_7d: number;
    market_cap: number;
    last_updated: string;
}

export interface CryptoInfo {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    logo: string;
    description: string;
    category: string;
    urls: {
        website: string[];
        twitter: string[];
        reddit: string[];
        source_code: string[];
        explorer: string[];
    };
    tags: string[];
    date_added: string;
}

export interface PriceConversion {
    id: number;
    symbol: string;
    name: string;
    amount: number;
    last_updated: string;
    converted_price: number;
    converted_currency: string;
}

export interface FearGreedIndex {
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
}

export const cryptoService = {
    getListings: async (limit: number = 50, convert: string = 'USD'): Promise<CryptoListing[]> => {
        const { data } = await api.get(`/crypto/listings?limit=${limit}&convert=${convert}`);
        return data;
    },

    getGlobalMetrics: async (convert: string = 'USD'): Promise<GlobalMetrics> => {
        const { data } = await api.get(`/crypto/global?convert=${convert}`);
        return data;
    },

    getFearGreedIndex: async () => {
        const { data } = await api.get('/crypto/fear-greed');
        return data as FearGreedIndex;
    },

    getQuotes: async (symbols: string, convert: string = 'USD'): Promise<Record<string, CryptoQuote>> => {
        const { data } = await api.get(`/crypto/quotes?symbols=${symbols}&convert=${convert}`);
        return data;
    },

    getInfo: async (symbols: string): Promise<Record<string, CryptoInfo>> => {
        const { data } = await api.get(`/crypto/info?symbols=${symbols}`);
        return data;
    },

    convertPrice: async (amount: number, symbol: string, convert: string = 'IDR'): Promise<PriceConversion> => {
        const { data } = await api.get(`/crypto/convert?amount=${amount}&symbol=${symbol}&convert=${convert}`);
        return data;
    },
};
