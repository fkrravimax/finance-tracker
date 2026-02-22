import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import ExpensesByCategory from './ExpensesByCategory';

import ReportsSkeleton from './skeletons/ReportsSkeleton';
import PageTransition from './ui/PageTransition';
import { StaggerContainer, StaggerItem } from './ui/Motion';

import { useLanguage } from '../contexts/LanguageContext';

const Reports: React.FC = () => {
    const { t } = useLanguage();
    const [timeRange, setTimeRange] = useState('Monthly');
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const timeOptions = [
        { value: 'Daily', label: t('common.daily') },
        { value: 'Weekly', label: t('common.weekly') },
        { value: 'Monthly', label: t('common.monthly') },
        { value: 'Yearly', label: t('common.yearly') }
    ];

    const getLocalizedPeriodLabel = (val: string) => {
        const option = timeOptions.find(o => o.value === val);
        return option ? option.label : val;
    };

    const formatPeriod = (dateStr: string) => {
        const date = new Date(dateStr);
        if (timeRange === 'Daily') return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        if (timeRange === 'Weekly') return `Week of ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
        if (timeRange === 'Yearly') return date.getFullYear().toString();
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                // ... fetch logic
                // Artificial delay for smooth UX
                await new Promise(resolve => setTimeout(resolve, 300));
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

    // ...

    if (loading && !reportData) return <ReportsSkeleton />;

    return (
        <PageTransition>
            <StaggerContainer className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8">
                {/* Header */}
                <StaggerItem>
                    <header className="flex flex-wrap justify-between items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('reports.title')}</h2>
                    </header>

                    {/* Title Section */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">{t('reports.spendingOverview')}</h1>
                                <p className="text-slate-500 dark:text-[#cbbc90] text-base">{t('reports.spendingSubtitle')}</p>
                            </div>
                            {/* Time Range Filter (Dropdown) */}
                            <div className="relative z-10">
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="appearance-none bg-white dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] text-slate-900 dark:text-white py-2 pl-4 pr-10 rounded-xl font-bold text-sm cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-[#342d18] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                                >
                                    {timeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-[#cbbc90]">
                                    <span className="material-symbols-outlined text-xl">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </StaggerItem>

                {/* Top Row Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* History Table */}
                    <StaggerItem className="lg:col-span-2">
                        <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex flex-col gap-4 h-full">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('reports.history').replace('{period}', getLocalizedPeriodLabel(timeRange))}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-[#493f22]">
                                            <th className="pb-3 px-4 first:pl-2 font-semibold text-slate-500 dark:text-[#cbbc90]">{t('reports.period')}</th>
                                            <th className="pb-3 px-4 font-semibold text-slate-500 dark:text-[#cbbc90]">{t('reports.income')}</th>
                                            <th className="pb-3 px-4 font-semibold text-slate-500 dark:text-[#cbbc90]">{t('reports.expense')}</th>
                                            <th className="pb-3 px-4 last:pr-2 font-semibold text-slate-500 dark:text-[#cbbc90]">{t('reports.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-[#342d18]">
                                        {reportData?.history?.map((row: any) => (
                                            <tr key={row.period} className="group hover:bg-slate-50 dark:hover:bg-[#342d18/50]">
                                                <td className="py-3 px-4 first:pl-2 font-medium text-slate-900 dark:text-white">
                                                    {formatPeriod(row.period)}
                                                </td>
                                                <td className="py-3 px-4 text-green-600 dark:text-green-400 font-medium">
                                                    +{row.income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                                </td>
                                                <td className="py-3 px-4 text-red-600 dark:text-red-400 font-medium">
                                                    -{row.expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                                </td>
                                                <td className="py-3 px-4 last:pr-2">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${row.income > row.expense
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {row.income > row.expense ? t('reports.saved') : t('reports.overspent')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </StaggerItem>

                    {/* Right Column Cards */}
                    <StaggerItem className="flex flex-col gap-6">
                        {/* Budget vs Reality Card (Simplified Global) */}
                        <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary">fact_check</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('reports.realityCheck')} ({getLocalizedPeriodLabel(timeRange)})</h3>
                            </div>
                            <div className="flex flex-col gap-4">
                                {reportData?.budgetVsReality?.map((item: any) => {
                                    const isOverbudget = item.actual > item.limit && item.limit > 0;
                                    const percentage = item.limit > 0 ? (item.actual / item.limit) * 100 : 0;

                                    return (
                                        <div key={item.category} className="flex flex-col gap-1">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('reports.totalPeriodSpending').replace('{period}', t('common.monthly'))}</span>
                                                <span className="text-xs font-medium text-slate-500 dark:text-[#8e8568]">
                                                    {Number(item.actual).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                                                    <span className="text-slate-300 dark:text-[#493f22] mx-1">/</span>
                                                    {item.limit > 0 ? Number(item.limit).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }) : t('reports.noLimit')}
                                                </span>
                                            </div>
                                            <div className="relative w-full h-4 bg-slate-100 dark:bg-[#342d18] rounded-full overflow-hidden mt-1">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isOverbudget ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-right mt-1 font-bold text-slate-500 dark:text-[#cbbc90]">
                                                {percentage.toFixed(1)}% {t('reports.used')}
                                            </p>
                                        </div>
                                    );
                                })}
                                {(!reportData?.budgetVsReality || reportData.budgetVsReality.length === 0) && (
                                    <p className="text-sm text-slate-400 italic">{t('reports.noSpendingData')}</p>
                                )}
                            </div>
                        </div>

                        {/* Savings Card */}
                        {reportData?.history?.length > 0 && (
                            <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-[#cbbc90] font-medium mb-1">{t('reports.totalSavings')} ({getLocalizedPeriodLabel(timeRange)})</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                                        {reportData.history.reduce((acc: number, curr: any) => acc + (curr.income - curr.expense), 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                                    </h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-900/30 text-green-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined">savings</span>
                                </div>
                            </div>
                        )}
                    </StaggerItem>
                </div>

                {/* Middle Row: Cumulative Cash Flow (New Feature) */}
                <StaggerItem>
                    <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('reports.cumulativeCashFlow')}</h3>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">show_chart</span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#cbbc90]">{t('reports.trend')}</span>
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
                            <span>{t('reports.start')}</span>
                            <span>{t('reports.end')}</span>
                        </div>
                    </div>
                </StaggerItem>

                {/* Expenses by Category (Custom Date Range) */}
                <StaggerItem>
                    <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 md:p-8">
                        <ExpensesByCategory />
                    </div>
                </StaggerItem>
            </StaggerContainer>
        </PageTransition>
    );
};


export default Reports;
