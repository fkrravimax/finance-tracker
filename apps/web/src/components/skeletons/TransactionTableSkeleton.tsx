import React from 'react';
import Skeleton from '../Skeleton';

const TransactionTableSkeleton: React.FC = () => {
    return (
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
                        {[1, 2, 3, 4, 5, 6].map((i) => (
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
    );
};

export default TransactionTableSkeleton;
