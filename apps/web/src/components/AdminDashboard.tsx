
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    plan: 'FREE' | 'PREMIUM' | 'PLATINUM';
    createdAt: string;
}

const AdminDashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    useEffect(() => {
        fetchUsers();
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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Management (v1.1)</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage user roles and subscription plans</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {users.length} Users
                </div>
            </div>

            <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">User Details</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Role</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Plan</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map(user => (
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
                    {users.map(user => (
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
            </div>
        </div>
    );
};

export default AdminDashboard;
