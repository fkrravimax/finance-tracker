import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService, type CryptoQuote, type CryptoInfo } from '../services/cryptoService';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import Skeleton from './Skeleton';

const CryptoWatchlist = () => {
    const { t } = useLanguage();

    interface WatchlistItem {
        id: string;
        symbol: string;
    }

    interface SearchResult {
        id: number;
        name: string;
        symbol: string;
        rank: number;
    }

    const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
    const [quotes, setQuotes] = useState<Record<string, CryptoQuote>>({});
    const [infos, setInfos] = useState<Record<string, CryptoInfo>>({});
    const [loading, setLoading] = useState(true);

    // Search & Add States
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [holdings, setHoldings] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('crypto_holdings');
        return saved ? JSON.parse(saved) : {};
    });
    const [editingHolding, setEditingHolding] = useState<string | null>(null);
    const [holdingInput, setHoldingInput] = useState('');

    const fetchWatchlist = useCallback(async () => {
        try {
            const res = await api.get('/notifications/watchlist');
            setWatchlistItems(res.data);
            return res.data as WatchlistItem[];
        } catch (error) {
            console.error('Failed to fetch watchlist:', error);
            return [];
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            let items = watchlistItems;
            if (loading) {
                items = await fetchWatchlist();
            }

            if (items.length === 0) {
                setLoading(false);
                return;
            }

            const symbols = items.map(i => i.symbol).join(',');
            const [quotesData, infosData] = await Promise.all([
                cryptoService.getQuotes(symbols),
                cryptoService.getInfo(symbols),
            ]);
            setQuotes(quotesData);
            setInfos(infosData);
        } catch (error) {
            console.error('Failed to fetch watchlist data:', error);
        } finally {
            setLoading(false);
        }
    }, [watchlistItems, loading, fetchWatchlist]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 mins
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        localStorage.setItem('crypto_holdings', JSON.stringify(holdings));
    }, [holdings]);

    // Search Logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await cryptoService.search(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // Debounce 500ms

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery]);

    const addToWatchlist = async (symbol: string) => {
        if (symbol && !watchlistItems.some(i => i.symbol === symbol)) {
            try {
                setLoading(true);
                await api.post('/notifications/watchlist', { symbol });
                setSearchQuery('');
                setSearchResults([]);
                setShowAddForm(false);
                await fetchWatchlist();
            } catch (error) {
                console.error('Failed to add to watchlist:', error);
                setLoading(false);
            }
        }
    };

    const removeFromWatchlist = async (id: string, symbol: string) => {
        try {
            setWatchlistItems(prev => prev.filter(i => i.id !== id));
            await api.delete(`/notifications/watchlist/${id}`);

            const newHoldings = { ...holdings };
            delete newHoldings[symbol];
            setHoldings(newHoldings);
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
            fetchWatchlist();
        }
    };

    const saveHolding = (symbol: string) => {
        const amount = parseFloat(holdingInput);
        if (!isNaN(amount) && amount >= 0) {
            setHoldings({ ...holdings, [symbol]: amount });
        }
        setEditingHolding(null);
        setHoldingInput('');
    };

    const formatPrice = (price: number | undefined) => {
        if (!price) return '-';
        if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (price >= 0.01) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(8)}`;
    };

    const formatValue = (value: number) => {
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return `$${value.toFixed(2)}`;
    };

    const totalPortfolioValue = watchlistItems.reduce((total, item) => {
        const quote = quotes[item.symbol];
        const amount = holdings[item.symbol] || 0;
        return total + (quote?.price || 0) * amount;
    }, 0);

    const hasHoldings = Object.values(holdings).some(v => v > 0);

    return (
        <div className="space-y-6">
            {/* Portfolio Summary */}
            {hasHoldings && (
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-[#f4c025] dark:to-[#dca60e] rounded-2xl p-6 text-white dark:text-[#2b2616] shadow-lg shadow-amber-500/20">
                    <p className="text-sm font-bold opacity-80 mb-1">{t('crypto.portfolioValue')}</p>
                    <p className="text-3xl md:text-4xl font-black">{formatValue(totalPortfolioValue)}</p>
                    <p className="text-xs mt-2 opacity-70">{watchlistItems.length} {t('crypto.assetsTracked')}</p>
                </div>
            )}

            {/* Watchlist Header & Search */}
            <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 shadow-sm overflow-visible">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-[#f4c025]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <h3 className="text-slate-800 dark:text-white font-bold text-lg">{t('crypto.watchlist')}</h3>
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90]">{t('crypto.watchlistDesc')}</p>
                    </div>

                    <div className="relative z-20">
                        {showAddForm ? (
                            <div className="relative">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="BTC, ETH..."
                                        className="w-48 bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/10 rounded-lg py-2 px-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => { setShowAddForm(false); setSearchQuery(''); setSearchResults([]); }}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white px-2 py-2 rounded-lg text-sm"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                </div>

                                {/* Autocomplete Dropdown */}
                                {(searchResults.length > 0 || isSearching) && (
                                    <div className="absolute top-full left-0 w-64 mt-2 bg-white dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/10 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-3 text-center text-xs text-slate-400">Searching...</div>
                                        ) : (
                                            searchResults.map(coin => (
                                                <div
                                                    key={coin.id}
                                                    onClick={() => addToWatchlist(coin.symbol)}
                                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#2b2616] cursor-pointer flex items-center justify-between group border-b border-slate-50 dark:border-[#f4c025]/5 last:border-0"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#2b2616] flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-[#cbbc90]">
                                                            {coin.symbol[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{coin.name}</p>
                                                            <p className="text-xs text-slate-400 dark:text-[#8e8568]">{coin.symbol}</p>
                                                        </div>
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-300 dark:text-[#f4c025]/30 group-hover:text-amber-500 dark:group-hover:text-[#f4c025] text-lg">add_circle</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-amber-500 dark:bg-[#f4c025] text-white dark:text-[#2b2616] px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-600 dark:hover:bg-[#dca60e] transition-colors flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                {t('crypto.addCoin')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Coin Cards */}
                <div className="p-4 md:p-6 z-10 relative">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Array(6).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-[#f4c025]/10" />
                            ))}
                        </div>
                    ) : watchlistItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-[#cbbc90]">
                            <span className="material-symbols-outlined text-4xl mb-3 block">visibility</span>
                            <p className="font-bold">{t('crypto.emptyWatchlist')}</p>
                            <p className="text-sm mt-1">{t('crypto.addCoinsTip')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {watchlistItems.map((item) => {
                                const { symbol, id } = item;
                                const quote = quotes[symbol];
                                const info = infos[symbol];
                                const holding = holdings[symbol] || 0;
                                const value = (quote?.price || 0) * holding;

                                return (
                                    <div
                                        key={id}
                                        className="bg-slate-50 dark:bg-[#1e1b10] rounded-2xl border border-slate-100 dark:border-[#f4c025]/10 p-4 hover:border-amber-300 dark:hover:border-[#f4c025]/30 transition-all group relative"
                                    >
                                        <button
                                            onClick={() => removeFromWatchlist(id, symbol)}
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-400 dark:text-[#8e8568] dark:hover:text-rose-400"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>

                                        <div className="flex items-center gap-3 mb-3">
                                            {info?.logo ? (
                                                <img src={info.logo} alt={symbol} className="w-9 h-9 rounded-full" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {symbol.slice(0, 2)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{info?.name || symbol}</p>
                                                <p className="text-xs text-slate-400 dark:text-[#8e8568]">{symbol}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between mb-3">
                                            <p className="text-xl font-bold text-slate-800 dark:text-white">{formatPrice(quote?.price)}</p>
                                            <div className="text-right">
                                                <span className={`text-sm font-bold ${(quote?.percent_change_24h || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {(quote?.percent_change_24h || 0) >= 0 ? '▲' : '▼'} {Math.abs(quote?.percent_change_24h || 0).toFixed(2)}%
                                                </span>
                                                <p className="text-[10px] text-slate-400 dark:text-[#8e8568]">24h</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 dark:border-[#f4c025]/10 pt-3">
                                            {editingHolding === symbol ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={holdingInput}
                                                        onChange={(e) => setHoldingInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveHolding(symbol)}
                                                        placeholder="0.00"
                                                        className="flex-1 bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#f4c025]/20 rounded-lg py-1.5 px-3 text-sm text-slate-800 dark:text-white focus:outline-none"
                                                        autoFocus
                                                        step="any"
                                                    />
                                                    <button
                                                        onClick={() => saveHolding(symbol)}
                                                        className="text-amber-500 dark:text-[#f4c025] text-sm font-bold"
                                                    >
                                                        {t('common.save')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex justify-between items-center cursor-pointer hover:bg-white dark:hover:bg-[#2b2616] -mx-2 px-2 py-1 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        setEditingHolding(symbol);
                                                        setHoldingInput(holding > 0 ? holding.toString() : '');
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-xs text-slate-400 dark:text-[#8e8568]">{t('crypto.holdings')}</p>
                                                        <p className="text-sm font-bold text-slate-600 dark:text-[#cbbc90]">
                                                            {holding > 0 ? `${holding} ${symbol}` : t('crypto.tapToAdd')}
                                                        </p>
                                                    </div>
                                                    {holding > 0 && (
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                            {formatValue(value)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CryptoWatchlist;
