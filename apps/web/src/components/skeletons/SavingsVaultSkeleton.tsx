import React from 'react';
import Skeleton from '../Skeleton';

const SavingsVaultSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-5 w-64 rounded" />
                </div>
                <Skeleton className="h-12 w-40 rounded-xl" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col gap-3 rounded-2xl p-6 bg-white dark:bg-[#342d18] shadow-sm border border-slate-100 dark:border-[#493f22] h-40">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-5 w-24 rounded" />
                        </div>
                        <div className="mt-auto">
                            <Skeleton className="h-8 w-32 mb-2 rounded" />
                            <Skeleton className="h-4 w-20 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex flex-col bg-white dark:bg-[#342d18] rounded-2xl shadow-sm border border-slate-100 dark:border-[#493f22] overflow-hidden">
                        {/* Image Area */}
                        <Skeleton className="h-48 w-full rounded-t-2xl" />
                        <div className="p-5 flex flex-col gap-4 flex-1">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 w-3/4">
                                    <Skeleton className="h-6 w-3/4 rounded" />
                                    <Skeleton className="h-4 w-1/2 rounded" />
                                </div>
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20 rounded" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>
                                <Skeleton className="h-3 w-full rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavingsVaultSkeleton;
