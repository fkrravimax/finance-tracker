import { useState, useEffect } from 'react';
import { cryptoService, type CryptoListing, type GlobalMetrics } from '../services/cryptoService';
import { useLanguage } from '../contexts/LanguageContext';
import Skeleton from './Skeleton';

const CryptoMarket = () => {
    const { t } = useLanguage();
    const [listings, setListings] = useState<CryptoListing[]>([]);
    const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [logos, setLogos] = useState<Record<string, string>>({});

    const fetchData = async () => {
        try {
            const [listingsData, globalData] = await Promise.all([
                cryptoService.getListings(50),
                cryptoService.getGlobalMetrics(),
            ]);
            setListings(listingsData);
            setGlobalMetrics(globalData);

            // Fetch logos for top coins
            const symbols = listingsData.slice(0, 20).map((c: CryptoListing) => c.symbol).join(',');
            try {
                const infoData = await cryptoService.getInfo(symbols);
                const logoMap: Record<string, string> = {};
                Object.values(infoData).forEach((info: any) => {
                    logoMap[info.symbol] = info.logo;
                });
                setLogos(logoMap);
            } catch {
                // Logos are optional
            }
        } catch (error) {
            console.error('Failed to fetch crypto data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 min
        return () => clearInterval(interval);
    }, []);

    const filteredListings = listings.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.symbol.toLowerCase().includes(search.toLowerCase())
    );

    const formatNumber = (num: number | undefined, decimals = 2) => {
        if (num === undefined || num === null) return '-';
        if (Math.abs(num) >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (Math.abs(num) >= 1e3) return `$${num.toLocaleString(undefined, { maximumFractionDigits: decimals })}`;
        return `$${num.toFixed(decimals)}`;
    };

    const formatPrice = (price: number) => {
        if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (price >= 0.01) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(8)}`;
    };

    const ChangeIndicator = ({ value }: { value: number | undefined }) => {
        if (value === undefined || value === null) return <span className="text-slate-400">-</span>;
        const isPositive = value >= 0;
        return (
            <span className={`font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPositive ? '+' : ''}{value.toFixed(2)}%
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Global Stats Bar */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl bg-slate-200 dark:bg-[#f4c025]/10" />
                    ))}
                </div>
            ) : globalMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 p-4 shadow-sm">
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider mb-1">{t('crypto.totalMarketCap')}</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{formatNumber(globalMetrics.total_market_cap)}</p>
                        <ChangeIndicator value={globalMetrics.total_market_cap_yesterday_percentage_change} />
                    </div>
                    <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 p-4 shadow-sm">
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider mb-1">{t('crypto.volume24h')}</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{formatNumber(globalMetrics.total_volume_24h)}</p>
                        <ChangeIndicator value={globalMetrics.total_volume_24h_yesterday_percentage_change} />
                    </div>
                    <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 p-4 shadow-sm">
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider mb-1">{t('crypto.btcDominance')}</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-[#f4c025]">{globalMetrics.btc_dominance?.toFixed(1)}%</p>
                        <p className="text-xs text-slate-400 dark:text-[#8e8568]">Bitcoin</p>
                    </div>
                    <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 p-4 shadow-sm">
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider mb-1">{t('crypto.ethDominance')}</p>
                        <p className="text-lg font-bold text-indigo-500 dark:text-indigo-400">{globalMetrics.eth_dominance?.toFixed(1)}%</p>
                        <p className="text-xs text-slate-400 dark:text-[#8e8568]">Ethereum</p>
                    </div>
                </div>
            )}

            {/* Search & Table */}
            <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-[#f4c025]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-slate-800 dark:text-white font-bold text-lg">{t('crypto.marketOverview')}</h3>
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90]">{t('crypto.top50')}</p>
                    </div>
                    <input
                        type="text"
                        placeholder={t('common.search') + " (BTC, Ethereum...)"}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-64 bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/10 rounded-xl py-2.5 px-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025]/50"
                    />
                </div>

                <div className="overflow-x-auto" data-no-swipe="true">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider border-b border-slate-100 dark:border-[#f4c025]/10 bg-slate-50/50 dark:bg-[#1e1b10]/50">
                                <th className="p-4 font-semibold w-10">#</th>
                                <th className="p-4 font-semibold">{t('crypto.name')}</th>
                                <th className="p-4 font-semibold text-right">{t('crypto.price')}</th>
                                <th className="p-4 font-semibold text-right">1h</th>
                                <th className="p-4 font-semibold text-right">24h</th>
                                <th className="p-4 font-semibold text-right">7d</th>
                                <th className="p-4 font-semibold text-right">{t('crypto.marketCap')}</th>
                                <th className="p-4 font-semibold text-right">{t('crypto.volume')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-slate-700 dark:text-white divide-y divide-slate-50 dark:divide-[#f4c025]/5">
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        {Array(8).fill(0).map((_, j) => (
                                            <td key={j} className="p-4">
                                                <Skeleton className="h-4 bg-slate-200 dark:bg-[#f4c025]/10" style={{ width: j === 0 ? 20 : j === 1 ? 120 : 80 }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredListings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-[#cbbc90] italic">
                                        {t('crypto.noResults')}
                                    </td>
                                </tr>
                            ) : (
                                filteredListings.map((coin) => (
                                    <tr key={coin.id} className="hover:bg-slate-50 dark:hover:bg-[#f4c025]/5 transition-colors">
                                        <td className="p-4 text-slate-400 dark:text-[#8e8568] text-xs">{coin.cmc_rank}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {logos[coin.symbol] ? (
                                                    <img src={logos[coin.symbol]} alt={coin.symbol} className="w-7 h-7 rounded-full" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                        {coin.symbol.slice(0, 2)}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-bold text-slate-800 dark:text-white">{coin.name}</span>
                                                    <span className="ml-2 text-xs text-slate-400 dark:text-[#8e8568]">{coin.symbol}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-bold">{formatPrice(coin.price)}</td>
                                        <td className="p-4 text-right"><ChangeIndicator value={coin.percent_change_1h} /></td>
                                        <td className="p-4 text-right"><ChangeIndicator value={coin.percent_change_24h} /></td>
                                        <td className="p-4 text-right"><ChangeIndicator value={coin.percent_change_7d} /></td>
                                        <td className="p-4 text-right text-slate-600 dark:text-[#cbbc90]">{formatNumber(coin.market_cap, 0)}</td>
                                        <td className="p-4 text-right text-slate-600 dark:text-[#cbbc90]">{formatNumber(coin.volume_24h, 0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CryptoMarket;
