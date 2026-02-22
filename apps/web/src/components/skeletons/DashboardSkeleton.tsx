import React from 'react';
import Skeleton from '../Skeleton';

const DashboardSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-8">
            {/* Header Skeleton */}
            <header className="flex flex-wrap justify-between items-center md:items-end gap-4 md:gap-6 bg-transparent md:bg-white/60 dark:bg-transparent md:dark:bg-white/5 p-0 md:p-6 rounded-none md:rounded-bubbly shadow-none md:shadow-sm border-none md:border md:border-white/60 md:dark:border-white/5">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-6 w-32 rounded-lg mt-1" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-[44px] md:h-12 w-[120px] md:w-32 rounded-xl md:rounded-2xl" />
                    <Skeleton className="hidden md:block h-12 w-36 rounded-2xl" />
                </div>
            </header>

            {/* Top Row: Total Balance & Monthly Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Balance Card */}
                <div className="h-full flex flex-col justify-between rounded-bubbly p-8 bg-sky-dark/10 dark:bg-sky-900/10 border border-slate-100 dark:border-white/5 overflow-hidden relative">
                    <div className="flex justify-between items-start mb-6">
                        <Skeleton className="h-14 w-14 rounded-2xl" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-32 mb-2 rounded-lg" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-[48px] w-3/4 rounded-2xl mb-4" />
                            <Skeleton className="h-10 w-10 rounded-full mb-4" />
                        </div>
                        <Skeleton className="h-6 w-32 rounded-full mt-1" />
                    </div>
                </div>

                {/* Budget Card */}
                <div className="h-full flex flex-col justify-center rounded-bubbly p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 shadow-card overflow-hidden relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-7 w-40 rounded-lg" />
                            <Skeleton className="h-4 w-48 rounded-lg mt-1" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-3 mb-6">
                        <Skeleton className="h-[48px] w-24 rounded-2xl" />
                        <Skeleton className="h-6 w-40 rounded-lg mb-1" />
                    </div>
                    <Skeleton className="h-6 w-full rounded-full mb-5" />
                    <Skeleton className="h-[52px] w-full rounded-2xl" />
                </div>
            </div>

            {/* Middle Row: Cash Flow (col-1) & Transactions (col-2) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Cash Flow Area */}
                <div className="xl:col-span-1 h-[400px] bg-white dark:bg-surface-dark rounded-bubbly p-6 border border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="flex justify-between mb-8 cursor-default">
                        <div className="flex flex-col gap-1">
                            <Skeleton className="h-6 w-24 rounded-lg" />
                            <Skeleton className="h-4 w-32 rounded-lg" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Skeleton className="h-4 w-16 rounded-lg" />
                            <Skeleton className="h-6 w-32 rounded-lg" />
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-6">
                        <div>
                            <Skeleton className="h-4 w-16 rounded mb-2" />
                            <Skeleton className="h-4 w-full rounded-full" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-16 rounded mb-2" />
                            <Skeleton className="h-4 w-full rounded-full" />
                        </div>
                    </div>
                    <div className="mt-auto pt-8 flex justify-center">
                        <Skeleton className="h-20 w-24 rounded-2xl" />
                    </div>
                </div>

                {/* Recent Transactions Area */}
                <div className="xl:col-span-2 h-[400px] bg-white dark:bg-surface-dark rounded-bubbly p-6 border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col gap-4">
                    <div className="flex justify-between mb-2 shrink-0">
                        <Skeleton className="h-6 w-40 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded-lg" />
                    </div>
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 py-3">
                                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-32 mb-1.5 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                                <Skeleton className="h-5 w-24 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
