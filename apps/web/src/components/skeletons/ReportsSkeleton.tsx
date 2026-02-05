import React from 'react';
import Skeleton from '../Skeleton';

const ReportsSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8">
            {/* Header / Title Section */}
            <div className="flex flex-col gap-4">
                <Skeleton className="h-6 w-48 rounded" />
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2 w-1/2">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-5 w-48 rounded" />
                    </div>
                    {/* Time Range Filter Mock */}
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-20 rounded-xl" />
                        <Skeleton className="h-10 w-20 rounded-xl" />
                        <Skeleton className="h-10 w-20 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* History Table Area */}
                <div className="lg:col-span-2 bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex flex-col gap-4 h-[400px]">
                    <Skeleton className="h-7 w-32 mb-4 rounded" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex justify-between items-center">
                                <Skeleton className="h-4 w-20 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-6 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column Cards */}
                <div className="flex flex-col gap-6">
                    {/* Reality Check Card */}
                    <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 flex flex-col gap-4 h-64">
                        <div className="flex items-center gap-2 mb-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-40 rounded" />
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i}>
                                <div className="flex justify-between mb-1">
                                    <Skeleton className="h-3 w-20 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                                <Skeleton className="h-3 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                    {/* Savings Card */}
                    <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 h-32 flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-8 w-32 rounded" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Cash Flow Chart Skeleton */}
            <div className="bg-white dark:bg-[#2a2515] border border-slate-200 dark:border-[#493f22] rounded-2xl p-6 md:p-8 h-80 flex flex-col gap-4">
                <div className="flex justify-between">
                    <Skeleton className="h-7 w-48 rounded" />
                    <Skeleton className="h-5 w-32 rounded" />
                </div>
                <Skeleton className="w-full h-full rounded-xl" />
            </div>
        </div>
    );
};

export default ReportsSkeleton;
