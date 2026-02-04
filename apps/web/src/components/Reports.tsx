import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import ExpensesByCategory from './ExpensesByCategory';

const Reports: React.FC = () => {
    const [timeRange, setTimeRange] = useState('Monthly');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const timeOptions = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                // Pass lowercased range to API
                const data = await dashboardService.getReport(timeRange.toLowerCase());
                setReportData(data);
            } catch (error) {
                console.error("Failed to fetch report", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [timeRange]);

    // Helper to scale values for SVG chart (0-300 height)




    // Calculate Area path for Expense


    const formatPeriod = (dateStr: string) => {
        const date = new Date(dateStr);
        if (timeRange === 'Daily') return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        if (timeRange === 'Weekly') return `Week of ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
        if (timeRange === 'Yearly') return date.getFullYear().toString();
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    if (loading && !reportData) return <div className="p-8">Loading reports...</div>;

    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8">
            {/* Header */}
            <header className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h2>
            </header>

            {/* Title Section */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Spending Overview</h1>
                        <p className="text-slate-500 dark:text-[#cbbc90] text-base">Track your financial health over time.</p>
                    </div>
                    {/* Time Range Filter */}
                    <div className="flex bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-xl p-1">
                        {timeOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => setTimeRange(option)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${timeRange === option
                                    ? 'bg-primary text-slate-900 shadow-sm'
                                    : 'text-slate-500 dark:text-[#cbbc90] hover:bg-slate-50 dark:hover:bg-[#342d18]'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Row Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* History Table */}
                <div className="lg:col-span-2 bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{timeRange} History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-[#493f22]">
                                    <th className="pb-3 font-semibold text-slate-500 dark:text-[#cbbc90]">Period</th>
                                    <th className="pb-3 font-semibold text-slate-500 dark:text-[#cbbc90]">Income</th>
                                    <th className="pb-3 font-semibold text-slate-500 dark:text-[#cbbc90]">Expense</th>
                                    <th className="pb-3 font-semibold text-slate-500 dark:text-[#cbbc90]">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#342d18]">
                                {reportData?.history?.map((row: any) => (
                                    <tr key={row.period} className="group hover:bg-slate-50 dark:hover:bg-[#342d18/50]">
                                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                                            {formatPeriod(row.period)}
                                        </td>
                                        <td className="py-3 text-green-600 dark:text-green-400">
                                            +{row.income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                        </td>
                                        <td className="py-3 text-red-600 dark:text-red-400">
                                            -{row.expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${row.income > row.expense
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {row.income > row.expense ? 'Saved' : 'Overspent'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column Cards */}
                <div className="flex flex-col gap-6">
                    {/* Budget vs Reality Card (Simplified Global) */}
                    <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary">fact_check</span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">The Reality Check (Monthly)</h3>
                        </div>
                        <div className="flex flex-col gap-4">
                            {reportData?.budgetVsReality?.map((item: any) => {
                                const isOverbudget = item.actual > item.limit && item.limit > 0;
                                const percentage = item.limit > 0 ? (item.actual / item.limit) * 100 : 0;

                                return (
                                    <div key={item.category} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">Total Monthly Spending</span>
                                            <span className="text-xs font-medium text-slate-500 dark:text-[#8e8568]">
                                                {Number(item.actual).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                                                <span className="text-slate-300 dark:text-[#493f22] mx-1">/</span>
                                                {item.limit > 0 ? Number(item.limit).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }) : 'No Limit'}
                                            </span>
                                        </div>
                                        <div className="relative w-full h-4 bg-slate-100 dark:bg-[#342d18] rounded-full overflow-hidden mt-1">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isOverbudget ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-right mt-1 font-bold text-slate-500 dark:text-[#cbbc90]">
                                            {percentage.toFixed(1)}% Used
                                        </p>
                                    </div>
                                );
                            })}
                            {(!reportData?.budgetVsReality || reportData.budgetVsReality.length === 0) && (
                                <p className="text-sm text-slate-400 italic">No spending data yet for this month.</p>
                            )}
                        </div>
                    </div>

                    {/* Savings Card */}
                    {reportData?.history?.length > 0 && (
                        <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-[#cbbc90] font-medium mb-1">Total Savings ({timeRange})</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                                    {reportData.history.reduce((acc: number, curr: any) => acc + (curr.income - curr.expense), 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-900/30 text-green-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">savings</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Row: Cumulative Cash Flow (New Feature) */}
            <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cumulative Cash Flow</h3>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">show_chart</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#cbbc90]">This Month Trend</span>
                    </div>
                </div>
                <div className="relative h-64 w-full">
                    {/* Using the same SVG technique but for line chart */}
                    <svg viewBox="0 0 1000 300" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                        {(() => {
                            const flow = reportData?.cashFlow || [];
                            if (flow.length < 2) return null;
                            const minVal = Math.min(...flow.map((d: any) => d.balance));
                            const maxVal = Math.max(...flow.map((d: any) => d.balance));
                            const range = maxVal - minVal || 1;

                            const points = flow.map((d: any, i: number) => {
                                const x = (i / (flow.length - 1)) * 1000;
                                // Normalize y to 0-300 range (flipped because SVG y=0 is top)
                                const y = 300 - ((d.balance - minVal) / range) * 280 - 10;
                                return `${x},${y}`;
                            }).join(" ");

                            return (
                                <>
                                    <defs>
                                        <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d={`M0,300 L${points.replace(/ /g, " L")} L1000,300 Z`} fill="url(#flowGradient)" />
                                    <polyline points={points} fill="none" stroke="#22c55e" strokeWidth="3" />
                                    {/* Simple dots for days */}
                                    {flow.map((d: any, i: number) => {
                                        const x = (i / (flow.length - 1)) * 1000;
                                        const y = 300 - ((d.balance - minVal) / range) * 280 - 10;
                                        return <circle key={i} cx={x} cy={y} r="3" fill="#2a2515" stroke="#22c55e" strokeWidth="2" />
                                    })}
                                </>
                            );
                        })()}
                    </svg>
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400 dark:text-[#685a31] font-medium">
                    <span>Start of Month</span>
                    <span>End of Month</span>
                </div>
            </div>



            {/* Expenses by Category (Custom Date Range) */}
            <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 md:p-8">
                <ExpensesByCategory />
            </div>
        </div>
    );
};


export default Reports;
