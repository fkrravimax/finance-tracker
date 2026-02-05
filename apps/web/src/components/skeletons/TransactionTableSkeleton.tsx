import React from 'react';
import Skeleton from '../Skeleton';

const TransactionTableSkeleton: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12 flex flex-col gap-8">
            {/* Header Skeleton */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-2 w-full md:w-1/3">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-5 w-64 rounded" />
                </div>
                {/* Filter Controls Mock */}
                <div className="flex gap-2 w-full md:w-auto">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-10 w-24 rounded-lg" />
                    ))}
                </div>
            </header>

            {/* Stats Overview Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-[#342d18] p-6 rounded-2xl border border-slate-100 dark:border-[#493f22] flex items-center gap-4 h-32">
                        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                        <div className="flex flex-col gap-2 w-full">
                            <Skeleton className="h-4 w-20 rounded" />
                            <Skeleton className="h-8 w-32 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] shadow-sm overflow-hidden animate-pulse">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#2b2616] border-b border-slate-200 dark:border-[#493f22]">
                                <th className="p-4 pl-6"><Skeleton className="h-4 w-24 rounded" /></th>
                                <th className="p-4"><Skeleton className="h-4 w-20 rounded" /></th>
                                <th className="p-4"><Skeleton className="h-4 w-24 rounded" /></th>
                                <th className="p-4"><Skeleton className="h-4 w-20 rounded" /></th>
                                <th className="p-4 pr-6 text-right"><Skeleton className="h-4 w-16 ml-auto rounded" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#493f22]">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <tr key={i}>
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                                            <Skeleton className="h-5 w-32 rounded" />
                                        </div>
                                    </td>
                                    <td className="p-4"><Skeleton className="h-4 w-24 rounded" /></td>
                                    <td className="p-4"><Skeleton className="h-4 w-28 rounded" /></td>
                                    <td className="p-4"><Skeleton className="h-5 w-24 rounded" /></td>
                                    <td className="p-4 pr-6 text-right">
                                        <Skeleton className="h-6 w-20 ml-auto rounded-md" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionTableSkeleton;
