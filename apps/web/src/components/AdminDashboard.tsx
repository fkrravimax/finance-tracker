
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { upgradeService } from '../services/upgradeService';
import { Crown, Check, X } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    plan: 'FREE' | 'PREMIUM' | 'PLATINUM';
    createdAt: string;
}

interface UpgradeRequest {
    id: string;
    userId: string;
    currentPlan: string;
    requestedPlan: string;
    status: string;
    createdAt: string;
    userName: string | null;
    userEmail: string | null;
}

import { useLanguage } from '../contexts/LanguageContext';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 10;

    // Filter and paginate users
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    );

    const fetchUsers = async () => {
        try {
            // Using authService.fetchWithAuth handles the Authorization header
            const response = await authService.fetchWithAuth('/api/admin/users');

            // fetchWithAuth returns the response object, we need to parse JSON
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUpgradeRequests = async () => {
        try {
            const requests = await upgradeService.getPendingRequests();
            setUpgradeRequests(requests);
        } catch (err) {
            console.error('Failed to fetch upgrade requests:', err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchUpgradeRequests();
    }, []);

    const handleUpdate = async (id: string, field: 'role' | 'plan', value: string) => {
        // Optimistic update
        const previousUsers = [...users];
        setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));

        try {
            await authService.fetchWithAuth(`/api/admin/users/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ [field]: value }),
            });
        } catch (err) {
            console.error("Failed to update user", err);
            // Revert on failure
            setUsers(previousUsers);
            alert("Failed to update user");
        }
    };

    const handleUpgradeAction = async (requestId: string, action: 'approve' | 'reject') => {
        setProcessingId(requestId);
        const result = await upgradeService.processRequest(requestId, action);

        if (result.success) {
            // Remove from pending list
            setUpgradeRequests(prev => prev.filter(r => r.id !== requestId));
            // Refresh users to update plan
            if (action === 'approve') {
                fetchUsers();
            }
        } else {
            alert(result.error || 'Failed to process request');
        }
        setProcessingId(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
                {error}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Upgrade Requests Section */}
            {upgradeRequests.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-700/50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">{t('admin.upgradeRequests')}</h2>
                            <p className="text-sm text-amber-600 dark:text-amber-400">{upgradeRequests.length} {t('admin.pendingRequests')}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {upgradeRequests.map(request => (
                            <div
                                key={request.id}
                                className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-200 dark:border-amber-700/30"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800 dark:text-white">{request.userName || 'Unknown User'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{request.userEmail}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{request.currentPlan}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">{request.requestedPlan}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpgradeAction(request.id, 'reject')}
                                        disabled={processingId === request.id}
                                        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4" />
                                        {t('admin.reject')}
                                    </button>
                                    <button
                                        onClick={() => handleUpgradeAction(request.id, 'approve')}
                                        disabled={processingId === request.id}
                                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        <Check className="w-4 h-4" />
                                        {t('admin.approve')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User Management Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('admin.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('admin.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {upgradeRequests.length > 0 && (
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            {upgradeRequests.length} {t('admin.pendingRequests')}
                        </div>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                        {users.length} {t('admin.users')}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
            </div>

            {/* Results info */}
            {searchQuery && (
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
                    Showing {filteredUsers.length} of {users.length} users
                </p>
            )}

            <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300" style={{ tableLayout: 'fixed' }}>
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[40%]">{t('admin.users')}</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[20%]">{t('admin.role')}</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[20%]">{t('admin.plan')}</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap w-[20%]">{t('admin.joinedDate')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                                    </td>
                                </tr>
                            ) : paginatedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                                            <span className="text-xs text-gray-500">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdate(user.id, 'role', e.target.value)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer transition-colors
                                                ${user.role === 'ADMIN'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}
                                            `}
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.plan}
                                            onChange={(e) => handleUpdate(user.id, 'plan', e.target.value)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer transition-colors
                                                ${user.plan === 'PLATINUM'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                                                    : user.plan === 'PREMIUM'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}
                                            `}
                                        >
                                            <option value="FREE">Free</option>
                                            <option value="PREMIUM">Premium</option>
                                            <option value="PLATINUM">Platinum</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                        </div>
                    ) : paginatedUsers.map(user => (
                        <div key={user.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 dark:text-white text-base">{user.name}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <select
                                    value={user.role}
                                    onChange={(e) => handleUpdate(user.id, 'role', e.target.value)}
                                    className={`
                                        flex-1 px-3 py-2 rounded-lg text-xs font-medium border outline-none transition-colors
                                        ${user.role === 'ADMIN'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                                            : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}
                                    `}
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>

                                <select
                                    value={user.plan}
                                    onChange={(e) => handleUpdate(user.id, 'plan', e.target.value)}
                                    className={`
                                        flex-1 px-3 py-2 rounded-lg text-xs font-medium border outline-none transition-colors
                                        ${user.plan === 'PLATINUM'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                                            : user.plan === 'PREMIUM'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}
                                    `}
                                >
                                    <option value="FREE">Free</option>
                                    <option value="PREMIUM">Premium</option>
                                    <option value="PLATINUM">Platinum</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Page {currentPage} of {totalPages} · {filteredUsers.length} users
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="First page"
                            >
                                <span className="material-symbols-outlined text-lg">first_page</span>
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Previous page"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            {/* Page number buttons */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-primary text-white'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Next page"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Last page"
                            >
                                <span className="material-symbols-outlined text-lg">last_page</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
