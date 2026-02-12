import { useState, useEffect } from 'react';
import { cryptoService, type GlobalMetrics, type CryptoQuote } from '../services/cryptoService';
import { useLanguage } from '../contexts/LanguageContext';
// import { authService } from '../services/authService';
import Skeleton from './Skeleton';

const CryptoSentiment = () => {
    const { t } = useLanguage();
    const [global, setGlobal] = useState<GlobalMetrics | null>(null);
    const [btcQuote, setBtcQuote] = useState<CryptoQuote | null>(null);
    const [ethQuote, setEthQuote] = useState<CryptoQuote | null>(null);
    const [fearGreed, setFearGreed] = useState<any | null>(null); // Type 'any' for now or import FearGreedIndex
    const [loading, setLoading] = useState(true);

    // Only show for Platinum users
    // const user = authService.getCurrentUser();
    const isPlatinum = true; // user?.plan === 'PLATINUM';

    useEffect(() => {
        if (!isPlatinum) return;
        const fetchData = async () => {
            try {
                const [globalData, quotesData, fearGreedData] = await Promise.all([
                    cryptoService.getGlobalMetrics(),
                    cryptoService.getQuotes('BTC,ETH'),
                    cryptoService.getFearGreedIndex(),
                ]);
                setGlobal(globalData);
                setBtcQuote(quotesData['BTC'] || null);
                setEthQuote(quotesData['ETH'] || null);
                setFearGreed(fearGreedData);
            } catch (error) {
                console.error('Failed to fetch crypto sentiment:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isPlatinum]);

    if (!isPlatinum) return null;

    const formatCap = (num: number | undefined) => {
        if (!num) return '-';
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        return `$${(num / 1e6).toFixed(2)}M`;
    };

    const formatPrice = (price: number | undefined) => {
        if (!price) return '-';
        return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Sentiment based on Fear & Greed Index
    const getSentiment = () => {
        if (!fearGreed) return { label: '-', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-white/5', icon: 'remove' };

        const value = parseInt(fearGreed.value);
        // Extreme Fear (0-24)
        if (value < 25) return { label: t('crypto.sentimentExtremeFear'), color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', icon: 'sentiment_very_dissatisfied' };
        // Fear (25-46)
        if (value < 47) return { label: t('crypto.sentimentFear'), color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', icon: 'sentiment_dissatisfied' };
        // Neutral (47-54)
        if (value < 55) return { label: t('crypto.sentimentNeutral'), color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10', icon: 'sentiment_neutral' };
        // Greed (55-75)
        if (value < 76) return { label: t('crypto.sentimentGreed'), color: 'text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: 'sentiment_satisfied' };
        // Extreme Greed (76-100)
        return { label: t('crypto.sentimentExtremeGreed'), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: 'sentiment_very_satisfied' };
    };

    const sentiment = getSentiment();

    if (loading) {
        return (
            <div className="rounded-bubbly p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-card">
                <Skeleton className="h-6 w-40 bg-slate-200 dark:bg-white/5 mb-4" />
                <div className="grid grid-cols-2 gap-3">
                    {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-white/5" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-bubbly p-6 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-card relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-2 -mt-2"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 dark:text-[#f4c025]">currency_bitcoin</span>
                    <h3 className="text-slate-800 dark:text-white font-extrabold">{t('crypto.marketSentiment')}</h3>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${sentiment.bg}`}>
                    <span className={`material-symbols-outlined text-[16px] ${sentiment.color}`}>{sentiment.icon}</span>
                    <span className={`text-xs font-bold ${sentiment.color}`}>
                        {fearGreed ? `${fearGreed.value} - ` : ''}{sentiment.label}
                    </span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                {/* BTC Price */}
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[8px] font-bold">₿</div>
                        <span className="text-xs text-slate-500 dark:text-[#cbbc90]">BTC</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{formatPrice(btcQuote?.price)}</p>
                    <span className={`text-[10px] font-bold ${(btcQuote?.percent_change_24h || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {(btcQuote?.percent_change_24h || 0) >= 0 ? '+' : ''}{btcQuote?.percent_change_24h?.toFixed(2)}%
                    </span>
                </div>

                {/* ETH Price */}
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center text-white text-[8px] font-bold">Ξ</div>
                        <span className="text-xs text-slate-500 dark:text-[#cbbc90]">ETH</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{formatPrice(ethQuote?.price)}</p>
                    <span className={`text-[10px] font-bold ${(ethQuote?.percent_change_24h || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {(ethQuote?.percent_change_24h || 0) >= 0 ? '+' : ''}{ethQuote?.percent_change_24h?.toFixed(2)}%
                    </span>
                </div>

                {/* Market Cap */}
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase mb-1">{t('crypto.totalMarketCap')}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{formatCap(global?.total_market_cap)}</p>
                </div>

                {/* BTC Dominance */}
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase mb-1">{t('crypto.btcDominance')}</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-[#f4c025]">{global?.btc_dominance?.toFixed(1)}%</p>
                </div>
            </div>
        </div>
    );
};

export default CryptoSentiment;
