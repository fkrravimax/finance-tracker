import React from 'react';
import Skeleton from '../Skeleton';

const DashboardSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-8">
            {/* Header Skeleton */}
            <header className="flex flex-wrap justify-between items-end gap-6 bg-white/60 dark:bg-white/5 p-6 rounded-bubbly shadow-sm border border-white/60 dark:border-white/5">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                    <Skeleton className="h-10 w-3/4 rounded-xl" />
                    <Skeleton className="h-6 w-1/2 rounded-lg" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-12 w-32 rounded-2xl" />
                    <Skeleton className="h-12 w-32 rounded-2xl" />
                </div>
            </header>

            {/* Stats Check Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total Balance Card */}
                <div className="flex flex-col justify-between rounded-bubbly p-8 bg-sky-dark/10 dark:bg-sky-900/10 border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between mb-6">
                        <Skeleton className="h-14 w-14 rounded-2xl" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-32 mb-4 rounded-lg" />
                        <Skeleton className="h-12 w-3/4 rounded-2xl mb-4" />
                        <Skeleton className="h-4 w-40 rounded-full" />
                    </div>
                </div>

                {/* Budget Card */}
                <div className="flex flex-col justify-center rounded-bubbly p-8 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between mb-4">
                        <Skeleton className="h-8 w-40 rounded-lg" />
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                    </div>
                    <div className="flex items-end gap-3 mb-6">
                        <Skeleton className="h-12 w-24 rounded-xl" />
                        <Skeleton className="h-6 w-32 rounded-lg mb-2" />
                    </div>
                    <Skeleton className="h-4 w-full rounded-full mb-4" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
            </div>

            {/* Charts & List Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="xl:col-span-2 h-96 bg-white dark:bg-surface-dark rounded-bubbly p-6 border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between mb-6">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-8 w-32 rounded-lg" />
                    </div>
                    <Skeleton className="w-full h-full rounded-xl" />
                </div>

                {/* Recent Transactions Area */}
                <div className="h-96 bg-white dark:bg-surface-dark rounded-bubbly p-6 border border-slate-100 dark:border-white/5 flex flex-col gap-4">
                    <div className="flex justify-between mb-2">
                        <Skeleton className="h-6 w-40 rounded-lg" />
                        <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 py-2">
                            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-24 mb-2 rounded" />
                                <Skeleton className="h-3 w-16 rounded" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
