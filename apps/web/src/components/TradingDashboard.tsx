import { useState, useEffect } from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, Plus, Lock, Crown } from 'lucide-react';
import { authService } from '../services/authService';
import { useAppearance } from '../contexts/AppearanceContext';
import LogTradeModal from './LogTradeModal';
import WithdrawTradeModal from './WithdrawTradeModal';
import DepositTradeModal from './DepositTradeModal';
import Skeleton from './Skeleton';

const TradingDashboard = () => {
    const { currentTheme } = useAppearance();
    const isDark = currentTheme === 'dark';
    const [stats, setStats] = useState<any>(null);
    const [trades, setTrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    // Get user plan
    const user = authService.getCurrentUser();
    const isPlatinum = user?.plan === 'PLATINUM';

    const fetchData = async () => {
        if (!isPlatinum) {
            setLoading(false);
            return;
        }
        try {
            const [statsRes, tradesRes] = await Promise.all([
                authService.fetchWithAuth('/api/trading/stats'),
                authService.fetchWithAuth('/api/trading')
            ]);
            setStats(await statsRes.json());
            setTrades(await tradesRes.json());
        } catch (error) {
            console.error("Failed to fetch trading data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Chart Data Preparation
    const equityData = stats?.equityCurve?.map((p: any) => ({
        date: new Date(p.date).toLocaleDateString(),
        value: p.value
    })) || [];

    const winRateData = [
        { name: 'Wins', value: stats?.wins || 0 },
        { name: 'Losses', value: stats?.losses || 0 },
    ];
    const COLORS = isDark ? ['#f4c025', '#333'] : ['#f59e0b', '#cbd5e1']; // Gold/Dark for Dark Mode, Amber/Slate for Light Mode

    const winRate = stats ? (stats.wins / (stats.wins + stats.losses) * 100).toFixed(0) : 0;

    // Show upgrade prompt for non-platinum users
    if (!isPlatinum) {
        return (
            <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto">
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="bg-white dark:bg-[#2b2616] rounded-3xl border border-slate-200 dark:border-[#f4c025]/20 p-8 md:p-12 max-w-lg text-center shadow-xl">
                        {/* Lock Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Lock className="w-10 h-10 text-white" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3">
                            Trading Terminal
                        </h1>

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-500/20 rounded-full mb-6">
                            <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Platinum Exclusive</span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-500 dark:text-[#cbbc90] mb-8 leading-relaxed">
                            Unlock the Trading Terminal to log trades, track your portfolio performance,
                            monitor win rates, and analyze your equity curve with advanced charts.
                        </p>

                        {/* Features List */}
                        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                            {[
                                { icon: 'candlestick_chart', text: 'Trade Logging' },
                                { icon: 'monitoring', text: 'Equity Curve' },
                                { icon: 'pie_chart', text: 'Win Rate Analytics' },
                                { icon: 'account_balance_wallet', text: 'Balance Tracking' },
                            ].map((feature) => (
                                <div key={feature.text} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-[#1e1b10] rounded-xl">
                                    <span className="material-symbols-outlined text-amber-500 text-lg">{feature.icon}</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-white">{feature.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-[0.98] flex items-center justify-center gap-2">
                            <Crown className="w-5 h-5" />
                            Upgrade to Platinum
                        </button>

                        <p className="text-xs text-slate-400 dark:text-[#8e8568] mt-4">
                            Contact admin to upgrade your plan
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 w-full max-w-[1600px] mx-auto text-slate-900 dark:text-[#e2e8f0] overflow-x-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-[#2b2616] p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.2)] gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        Trading Terminal
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 dark:text-[#cbbc90] mt-1">Manage your daily trades, performance, and journal.</p>
                </div>

                <div className="w-full md:w-auto mt-0 bg-slate-50 dark:bg-[#1e1b10] p-4 rounded-xl border border-slate-200 dark:border-[#f4c025]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center group hover:border-amber-400/40 dark:hover:border-[#f4c025]/40 transition-colors gap-4">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Wallet size={12} /> Trading Balance
                        </p>
                        {loading ? <Skeleton className="h-8 w-32 bg-slate-200 dark:bg-[#f4c025]/10" /> : (
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                                ${stats?.currentBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setIsDepositModalOpen(true)}
                            className="bg-white dark:bg-[#1e1b10] text-amber-600 dark:text-[#f4c025] border border-slate-200 dark:border-[#f4c025]/50 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-50 dark:hover:bg-[#f4c025]/10 transition-all active:scale-95 flex-1 sm:flex-none"
                        >
                            Deposit
                        </button>
                        <button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="bg-amber-500 dark:bg-[#f4c025] text-white dark:text-[#2b2616] px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-600 dark:hover:bg-[#dca60e] transition-all shadow-[0_0_15px_rgba(244,192,37,0.3)] hover:shadow-[0_0_20px_rgba(244,192,37,0.5)] transform active:scale-95 flex-1 sm:flex-none"
                        >
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Win Rate Card */}
                <div className="lg:col-span-1 bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] lg:min-h-auto shadow-sm">
                    <h3 className="text-slate-500 dark:text-[#cbbc90] font-medium absolute top-6 left-6">Win Rate</h3>
                    <div className="w-56 h-56 relative mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={winRateData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {winRateData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-bold text-slate-800 dark:text-white">{isNaN(Number(winRate)) ? 0 : winRate}%</span>
                            <span className="text-xs text-slate-500 dark:text-[#cbbc90] mt-1 tracking-widest uppercase">High</span>
                        </div>
                    </div>
                </div>

                {/* Equity Curve & Stats */}
                <div className="lg:col-span-3 bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 p-6 flex flex-col shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                        <div>
                            <h3 className="text-slate-800 dark:text-white font-bold text-lg">Equity Curve</h3>
                            <p className="text-xs text-slate-500 dark:text-[#cbbc90]">Performance over last 30 days</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="flex-1 md:flex-none bg-slate-50 dark:bg-[#1e1b10] px-4 py-2 rounded-lg border border-slate-200 dark:border-[#f4c025]/10 flex justify-between sm:block items-center">
                                <p className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase">Total PnL</p>
                                <p className={`text-xl font-bold ${stats?.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {stats?.totalPnl >= 0 ? '+' : ''}${stats?.totalPnl?.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex-1 md:flex-none bg-slate-50 dark:bg-[#1e1b10] px-4 py-2 rounded-lg border border-slate-200 dark:border-[#f4c025]/10 flex justify-between sm:block items-center">
                                <p className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase">Best Pair</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-xl font-bold text-amber-600 dark:text-[#f4c025]">{stats?.bestPair}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={equityData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isDark ? "#f4c025" : "#f59e0b"} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isDark ? "#f4c025" : "#f59e0b"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#2b2616' : '#fff',
                                        borderColor: isDark ? 'rgba(244,192,37,0.2)' : '#e2e8f0',
                                        color: isDark ? 'white' : '#1e293b'
                                    }}
                                    itemStyle={{ color: isDark ? '#f4c025' : '#d97706' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isDark ? "#f4c025" : "#f59e0b"}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Trade Log */}
            <div className="bg-white dark:bg-[#2b2616] rounded-2xl border border-slate-200 dark:border-[#f4c025]/10 p-4 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg">Trade Log</h3>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <input type="text" placeholder="Search pair..." className="w-full sm:w-auto bg-slate-50 dark:bg-[#1e1b10] border border-slate-200 dark:border-[#f4c025]/10 rounded-lg py-2 px-4 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-[#f4c025]/50" />
                        </div>
                        <button
                            onClick={() => setIsLogModalOpen(true)}
                            className="bg-amber-500 dark:bg-[#f4c025] text-white dark:text-[#2b2616] px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-600 dark:hover:bg-[#dca60e] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={16} /> Log Trade
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-slate-500 dark:text-[#cbbc90] uppercase tracking-wider border-b border-slate-200 dark:border-[#f4c025]/10">
                                <th className="p-4 font-semibold">Date & Time</th>
                                <th className="p-4 font-semibold">Pair</th>
                                <th className="p-4 font-semibold">Side</th>
                                <th className="p-4 font-semibold">Leverage</th>
                                <th className="p-4 font-semibold text-right">Entry / Exit</th>
                                <th className="p-4 font-semibold text-right">PnL</th>
                                <th className="p-4 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-slate-700 dark:text-white divide-y divide-slate-100 dark:divide-[#f4c025]/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4"><Skeleton className="w-24 h-4 bg-slate-200 dark:bg-[#f4c025]/10" /></td>
                                        <td className="p-4"><Skeleton className="w-16 h-4 bg-slate-200 dark:bg-[#f4c025]/10" /></td>
                                        <td className="p-4"><Skeleton className="w-12 h-4 bg-slate-200 dark:bg-[#f4c025]/10" /></td>
                                        <td className="p-4"><Skeleton className="w-8 h-4 bg-slate-200 dark:bg-[#f4c025]/10" /></td>
                                        <td className="p-4"><Skeleton className="w-24 h-4 bg-slate-200 dark:bg-[#f4c025]/10 ml-auto" /></td>
                                        <td className="p-4"><Skeleton className="w-20 h-4 bg-slate-200 dark:bg-[#f4c025]/10 ml-auto" /></td>
                                        <td className="p-4"><Skeleton className="w-16 h-4 bg-slate-200 dark:bg-[#f4c025]/10 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : trades.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[#cbbc90] italic">
                                        No trades logged yet. Start your journey!
                                    </td>
                                </tr>
                            ) : (
                                trades.map((trade) => (
                                    <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-[#f4c025]/5 transition-colors group">
                                        <td className="p-4 text-slate-500 dark:text-[#cbbc90]">
                                            {new Date(trade.openedAt).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-bold">{trade.pair}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${trade.type === 'LONG'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                {trade.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-[#cbbc90]">{trade.leverage}x</td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-slate-500 dark:text-[#cbbc90]">Entry: ${parseFloat(trade.entryPrice).toLocaleString()}</span>
                                                <span className="text-slate-800 dark:text-white">${parseFloat(trade.closePrice || '0').toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className={`p-4 text-right font-bold ${parseFloat(trade.pnl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {parseFloat(trade.pnl) >= 0 ? '+' : ''}${parseFloat(trade.pnl).toLocaleString()}
                                            <div className="text-[10px] font-normal opacity-70">
                                                {/* ROI Calc guess */}
                                                ({((parseFloat(trade.pnl) / parseFloat(trade.amount)) * 100).toFixed(2)}%)
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="flex items-center justify-end gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full ${trade.status === 'OPEN' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-[#cbbc90]'}`}></span>
                                                <span className="text-xs text-slate-500 dark:text-[#cbbc90] uppercase">{trade.status}</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <LogTradeModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSave={fetchData}
            />
            <WithdrawTradeModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                maxAmount={stats?.currentBalance || 0}
                onSuccess={fetchData}
            />

            <DepositTradeModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default TradingDashboard;
