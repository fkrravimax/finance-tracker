import React, { useState, useEffect } from 'react';
import { settingsService, type RecurringTransaction } from '../services/settingsService';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';
import CurrencyInput from './CurrencyInput';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import ConfirmationModal from './ConfirmationModal';
import ProfilePictureModal from './modals/ProfilePictureModal';

import { useNotification } from '../contexts/NotificationContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { authService } from '../services/authService';
import SessionList from './Settings/SessionList';
import PageTransition from './ui/PageTransition';
import { StaggerContainer, StaggerItem, ScaleButton } from './ui/Motion';

const Settings: React.FC = () => {
    const { theme, setTheme, privacyMode, setPrivacyMode } = useAppearance();
    const { language, setLanguage, t } = useLanguage();
    const [budgetLimit, setBudgetLimit] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const navigate = useNavigate();
    const { showNotification } = useNotification();



    // Load existing budget & Settings
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { dashboardService } = await import('../services/dashboardService');
                const stats = await dashboardService.getStats();
                if (stats.budget) {
                    setBudgetLimit(stats.budget.limit.toString());
                }

                // Check Session for Provider
                const sessionCtx = await authClient.getSession();

                if (sessionCtx.data) {
                    setNameForm({ name: sessionCtx.data.user.name || '' });
                    setCurrentUser(sessionCtx.data.user);
                } else {
                    // Fallback to local auth service if session is null (e.g. dev mode)
                    const localUser = authService.getCurrentUser();
                    if (localUser) setCurrentUser(localUser);
                }

                // Recurring
                const recurring = await settingsService.getRecurring();
                setRecurringTransactions(recurring);

            } catch (e) {
                console.error("Failed to load settings data", e);
            }
        };
        fetchData();
    }, []);

    // Tab State
    const [activeTab, setActiveTab] = useState('account');

    // Accordion State (Mobile)
    const [openSection, setOpenSection] = useState<string | null>(null); // Default closed
    const toggleSection = (id: string) => setOpenSection(prev => prev === id ? null : id);

    // Sub-section State (e.g. Login History)
    const [openSubSection, setOpenSubSection] = useState<string | null>(null);
    const toggleSubSection = (id: string) => setOpenSubSection(prev => prev === id ? null : id);

    const tabs = [
        { id: 'account', label: t('settings.account'), icon: 'manage_accounts' },
        { id: 'finance', label: t('settings.features'), icon: 'account_balance_wallet' }, // Reusing 'features' label/icon for Finance
        { id: 'appearance', label: t('settings.appearance'), icon: 'palette' },
        { id: 'notifications', label: t('settings.notifications'), icon: 'notifications' },
    ];

    const handleSaveBudget = async () => {
        setLoading(true);
        try {
            const { dashboardService } = await import('../services/dashboardService');
            await dashboardService.setBudget(Number(budgetLimit));
            showNotification("Budget updated successfully!");
        } catch (e) {
            console.error(e);
            showNotification("Failed to update budget", 'error');
        } finally {
            setLoading(false);
        }
    };


    // State for Recurring Transactions
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

    // Account Management State
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const [nameForm, setNameForm] = useState({ name: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [isUpdatingName, setIsUpdatingName] = useState(false);

    // Modal State
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        type: 'delete_recurring' | 'reset_app' | null;
        id?: string;
        title: string;
        message: string;
        isLoading: boolean;
    }>({
        isOpen: false,
        type: null,
        title: '',
        message: '',
        isLoading: false
    });

    // Form State
    const [newRecurring, setNewRecurring] = useState({ name: '', amount: '', date: '', frequency: 'Monthly' });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showNotification("New passwords do not match", 'error');
            return;
        }
        setIsChangingPassword(true);
        try {
            await authClient.changePassword({
                newPassword: passwordForm.newPassword,
                currentPassword: passwordForm.currentPassword,
                revokeOtherSessions: true,
            });
            showNotification("Password updated successfully!");
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error("Failed to update password", error);
            showNotification(error.message || "Failed to update password", 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };



    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingName(true);
        try {
            await authClient.updateUser({
                name: nameForm.name
            });
            showNotification("Profile name updated successfully!");
            // Update local storage if we use it for sync
            const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
            currentUserData.name = nameForm.name;
            localStorage.setItem('user', JSON.stringify(currentUserData));
            setCurrentUser((prev: any) => ({ ...prev, name: nameForm.name }));
        } catch (error: any) {
            console.error("Failed to update name", error);
            showNotification(error.message || "Failed to update name", 'error');
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleUpdateProfilePicture = async (imagePath: string) => {
        try {
            await authClient.updateUser({
                image: imagePath
            });

            // Optimistic update
            setCurrentUser((prev: any) => ({ ...prev, image: imagePath }));

            // Update local storage
            const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
            currentUserData.image = imagePath;
            localStorage.setItem('user', JSON.stringify(currentUserData));

            showNotification("Profile picture updated!");

        } catch (error: any) {
            console.error("Failed to update profile picture", error);
            showNotification(error.message || "Failed to update profile picture", 'error');
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            // Force reload to trigger App.tsx auth check and redirect to login
            window.location.href = '/';
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    // Handlers

    const { isSubscribed, subscribe, unsubscribe, loading: pushLoading, isSupported } = usePushNotifications();

    const handleUpdatePref = async (key: string, value: boolean) => {
        try {
            // Optimistic update
            setCurrentUser((prev: any) => ({ ...prev, [key]: value }));

            await authClient.updateUser({
                [key]: value
            } as any); // Cast to any because TS might not know about custom fields yet
        } catch (error) {
            console.error(`Failed to update ${key}`, error);
            showNotification("Failed to update preference", 'error');
            // Revert on failure
            setCurrentUser((prev: any) => ({ ...prev, [key]: !value }));
        }
    };


    const handleAddRecurring = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // FIX: Ensure types are explicitly Numbers and correct Enum strings
            const newTrans = await settingsService.createRecurring({
                name: newRecurring.name,
                amount: Number(newRecurring.amount),
                frequency: newRecurring.frequency as 'Monthly' | 'Weekly' | 'Yearly',
                date: Number(newRecurring.date),
                icon: 'sync'
            });
            setRecurringTransactions([...recurringTransactions, newTrans]);
            setNewRecurring({ name: '', amount: '', date: '', frequency: 'Monthly' });
            setIsRecurringModalOpen(false);
            showNotification("Recurring transaction added!");
        } catch (error) {
            console.error("Failed to add recurring transaction", error);
            showNotification("Failed to add recurring transaction. Please check inputs.", 'error');
        }
    };

    const handleDeleteRecurringClick = (id: string) => {
        setConfirmation({
            isOpen: true,
            type: 'delete_recurring',
            id,
            title: 'Delete Recurring Transaction?',
            message: 'Are you sure you want to delete this recurring transaction? This action cannot be undone.',
            isLoading: false
        });
    };

    const handleResetAppClick = () => {
        setConfirmation({
            isOpen: true,
            type: 'reset_app',
            title: 'Reset Application?',
            message: 'WARNING: Are you sure you want to delete ALL your transactions, goals, and budgets? This cannot be undone and you will be redirected to onboarding.',
            isLoading: false
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmation.type) return;

        setConfirmation(prev => ({ ...prev, isLoading: true }));

        try {
            if (confirmation.type === 'delete_recurring' && confirmation.id) {
                await settingsService.deleteRecurring(confirmation.id);
                setRecurringTransactions(recurringTransactions.filter(t => t.id !== confirmation.id));
            } else if (confirmation.type === 'reset_app') {
                await settingsService.resetAllData();
                navigate('/onboarding');
            }
            setConfirmation({ isOpen: false, type: null, title: '', message: '', isLoading: false });
        } catch (error) {
            console.error("Action failed", error);
            showNotification("Action failed. Please try again.", 'error');
            setConfirmation(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Plan Badge Helpers
    const getPlanBadgeStyles = (plan: string) => {
        switch (plan) {
            case 'PLATINUM':
                return 'bg-slate-900 text-white border-slate-700 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-no-repeat animate-shine';
            case 'PREMIUM':
            case 'GOLD':
                return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50';
            case 'SILVER':
                return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
            case 'FREE':
            default:
                return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700';
        }
    };

    // RENDER HELPERS - COMPONENTIZED

    const renderProfileCard = () => (
        <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
            <div className="relative group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                {currentUser?.image ? (
                    <img src={currentUser.image} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 dark:border-[#493f22]" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#2b2616] flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">edit</span>
                </div>
            </div>
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{currentUser?.name || 'User'}</h2>
                <p className="text-slate-500 dark:text-[#cbbc90] mb-3">{currentUser?.email}</p>
                {currentUser?.plan && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border ${getPlanBadgeStyles(currentUser.plan)}`}>
                        {currentUser.plan} Plan
                    </span>
                )}
            </div>
            {currentUser?.role === 'ADMIN' && (
                <Link
                    to="/admin"
                    className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold border border-slate-900 dark:border-white hover:opacity-90 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                    {t('sidebar.admin')}
                </Link>
            )}
            <button
                onClick={handleLogout}
                className="px-6 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center gap-2"
            >
                <span className="material-symbols-outlined">logout</span>
                {t('sidebar.logout')}
            </button>
        </div>
    );

    const renderAccountContent = (isMobile: boolean = false) => (
        <StaggerContainer className="flex flex-col gap-6 animate-fade-in">
            {/* Desktop: Profile Card Inside. Mobile: Profile Card is Outside */}
            {!isMobile && renderProfileCard()}

            {/* Profile Details Form */}
            <StaggerItem>
                <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-[#493f22] pb-4">{t('settings.profileDetails')}</h3>
                    <form onSubmit={handleUpdateName} className="flex flex-col gap-4 max-w-lg">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.profilePicture')}</label>
                            <div className="flex flex-wrap gap-4">
                                {currentUser?.image && !currentUser.image.startsWith('/default-profiles/') && (
                                    <div className="relative group cursor-pointer">
                                        <img
                                            src={currentUser.image}
                                            alt="Current"
                                            className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                                        />
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold">Current</span>
                                        </div>
                                    </div>
                                )}
                                {[1, 2, 3, 4].map((num) => {
                                    const imgPath = `/default-profiles/profilepict${num}.png`;
                                    const isSelected = currentUser?.image === imgPath;
                                    return (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => handleUpdateProfilePicture(imgPath)}
                                            className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}
                                        >
                                            <img
                                                src={imgPath}
                                                alt={`Profile ${num}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white drop-shadow-md">check</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.displayName')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nameForm.name}
                                    onChange={e => setNameForm({ ...nameForm, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <button
                                    type="submit"
                                    disabled={isUpdatingName}
                                    className="bg-slate-900 dark:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90"
                                >
                                    {isUpdatingName ? t('common.loading') : t('common.save')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </StaggerItem>

            {/* Security Section (Password, Email, Sessions) */}
            <StaggerItem>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Password & Email */}
                    <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm flex flex-col gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">lock</span>
                                {t('settings.changePassword')}
                            </h3>
                            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                                <input
                                    type="password"
                                    placeholder={t('settings.currentPassword')}
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder={t('settings.newPassword')}
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder={t('settings.confirmPassword')}
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-[#2b2616] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
                                    required
                                />
                                <button type="submit" disabled={isChangingPassword} className="bg-slate-900 dark:bg-slate-700 text-white font-bold py-2 rounded-xl text-sm hover:opacity-90 mt-2">
                                    {isChangingPassword ? t('common.loading') : t('settings.updatePassword')}
                                </button>
                            </form>
                        </div>


                    </div>

                    {/* Login History (Collapsible) */}
                    <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] overflow-hidden shadow-sm h-fit">
                        <button
                            onClick={() => toggleSubSection('login_history')}
                            className="w-full flex items-center justify-between p-6 transition-colors hover:bg-slate-50 dark:hover:bg-[#2b2616]"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">security</span>
                                Login History
                            </h3>
                            <div className="flex items-center gap-2">
                                {/* Hint for limit on mobile */}
                                {isMobile && openSubSection !== 'login_history' && (
                                    <span className="text-xs text-slate-400">View recent</span>
                                )}
                                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${openSubSection === 'login_history' ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </div>
                        </button>
                        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openSubSection === 'login_history' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                            <div className="overflow-hidden">
                                <div className="p-6 pt-0 border-t border-slate-100 dark:border-[#493f22]">
                                    <SessionList />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </StaggerItem>

            {/* Danger Zone */}
            <StaggerItem>
                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">{t('settings.dangerZone')}</h3>
                        <p className="text-sm text-red-600/70 dark:text-red-400/70">{t('settings.resetWarning')}</p>
                    </div>
                    <button
                        onClick={handleResetAppClick}
                        className="px-6 py-3 bg-white dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors"
                    >
                        {t('settings.resetApp')}
                    </button>
                </div>
            </StaggerItem>
        </StaggerContainer>
    );

    const renderFinanceContent = (isMobile: boolean = false) => (
        <StaggerContainer className="flex flex-col gap-6 animate-fade-in">
            {/* Budget Config */}
            <StaggerItem>
                <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                        Monthly Budget
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-[#cbbc90] mb-4">{t('settings.budgetDescription')}</p>
                    <div className="flex flex-col gap-2 max-w-md">
                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.budgetLimit')}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold">Rp</span>
                            <CurrencyInput
                                value={budgetLimit}
                                onChange={(val) => setBudgetLimit(val.toString())}
                                placeholder="e.g. 5.000.000"
                                className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-lg"
                            />
                        </div>
                        <ScaleButton
                            onClick={handleSaveBudget}
                            disabled={loading}
                            className="bg-primary hover:bg-[#dca60e] text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary/25 mt-2 w-full"
                        >
                            {loading ? t('common.loading') : t('settings.saveBudget')}
                        </ScaleButton>
                    </div>
                </div>
            </StaggerItem>

            {/* Recurring Transactions */}
            <StaggerItem>
                <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">update</span>
                            {t('settings.recurringTransactions')}
                        </h2>
                        <button
                            onClick={() => setIsRecurringModalOpen(true)}
                            className={`
                            flex items-center gap-2 rounded-xl bg-primary text-slate-900 font-bold shadow-sm hover:bg-[#dca60e] transition-colors
                            ${isMobile ? 'p-2' : 'px-4 py-2 text-sm'}
                        `}
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            {!isMobile && t('settings.addTransaction')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recurringTransactions.map(trans => (
                            <div key={trans.id} className="p-4 rounded-xl border border-slate-100 dark:border-[#493f22] flex flex-col gap-3 hover:shadow-md transition-all relative group bg-slate-50 dark:bg-[#1a160b]">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                        <span className="material-symbols-outlined">{trans.icon}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteRecurringClick(trans.id)}
                                        className="text-slate-300 dark:text-[#cbbc90] hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{trans.name}</h3>
                                    <p className="text-primary font-bold">{formatCurrency(trans.amount)}</p>
                                </div>
                                <div className="mt-auto pt-3 border-t border-slate-200 dark:border-[#493f22] flex items-center gap-2 text-xs text-slate-500 dark:text-[#cbbc90]">
                                    <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                                    <span>Every {trans.date}th of {trans.frequency.toLowerCase()}</span>
                                </div>
                            </div>
                        ))}
                        {recurringTransactions.length === 0 && (
                            <div className="col-span-full text-center py-8 text-slate-500 dark:text-[#cbbc90]">
                                No recurring transactions yet.
                            </div>
                        )}
                    </div>
                </div>
            </StaggerItem>
        </StaggerContainer>
    );

    const renderAppearanceContent = () => (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Theme */}
            <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('settings.theme')}</h2>
                <div className="grid grid-cols-3 gap-4">
                    {(['light', 'dark', 'system'] as const).map((themeOption) => (
                        <button
                            key={themeOption}
                            onClick={() => setTheme(themeOption)}
                            className={`
                                flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all
                                ${theme === themeOption
                                    ? 'bg-primary/10 border-primary text-slate-900 dark:text-white'
                                    : 'bg-slate-50 dark:bg-[#1a160b] border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2b2616]'
                                }
                            `}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === themeOption ? 'bg-primary text-slate-900' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {themeOption === 'light' ? 'light_mode' : themeOption === 'dark' ? 'dark_mode' : 'settings_brightness'}
                                </span>
                            </div>
                            <div className="hidden md:block">
                                <span className="capitalize font-bold">{t(`settings.${themeOption}` as any)}</span>
                            </div>
                            <div className="md:hidden">
                                <span className="capitalize font-bold text-xs">{t(`settings.${themeOption}` as any)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Language */}
            <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('settings.language')}</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${language === 'en' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-[#493f22]'
                            }`}
                    >
                        <span className="text-2xl">🇺🇸</span> {t('settings.english')}
                    </button>
                    <button
                        onClick={() => setLanguage('id')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${language === 'id' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-[#493f22]'
                            }`}
                    >
                        <span className="text-2xl">🇮🇩</span> {t('settings.indonesian')}
                    </button>
                </div>
            </div>

            {/* Privacy */}
            <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('settings.hideBalance')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setPrivacyMode('none')}
                        className={`p-4 rounded-xl border max-md:flex max-md:items-center max-md:gap-4 text-left transition-all ${privacyMode === 'none' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-100 dark:border-[#493f22]'
                            }`}
                    >
                        <div className="mb-2 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">visibility</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.showAll')}</h3>
                            <p className="text-xs text-slate-500">{t('settings.defaultVisibility')}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setPrivacyMode('hidden')}
                        className={`p-4 rounded-xl border max-md:flex max-md:items-center max-md:gap-4 text-left transition-all ${privacyMode === 'hidden' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-100 dark:border-[#493f22]'
                            }`}
                    >
                        <div className="mb-2 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">visibility_off</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.softHide')}</h3>
                            <p className="text-xs text-slate-500">{t('settings.hideTotalBalance')}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setPrivacyMode('extreme')}
                        className={`p-4 rounded-xl border max-md:flex max-md:items-center max-md:gap-4 text-left transition-all ${privacyMode === 'extreme' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-100 dark:border-[#493f22]'
                            }`}
                    >
                        <div className="mb-2 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">password</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.extremeHide')}</h3>
                            <p className="text-xs text-slate-500">{t('settings.hideAllNumbers')}</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderNotificationContent = () => (
        <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] p-6 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.enablePush')}</h2>
                    <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('settings.enablePushDesc')}</p>
                </div>
                <button
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={pushLoading}
                    className={`relative w-14 h-8 rounded-full transition-colors ${isSubscribed ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                    <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${isSubscribed ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {isSubscribed && (
                <div className="grid grid-cols-1 gap-6">
                    {[
                        { key: 'notifyRecurring', label: t('settings.notifyRecurring'), desc: t('settings.notifyRecurringDesc') },
                        { key: 'notifyBudget50', label: 'Budget Alert (50%)', desc: 'Notify when 50% of budget is used' },
                        { key: 'notifyBudget80', label: 'Budget Alert (80%)', desc: 'Notify when 80% of budget is used' },
                        { key: 'notifyBudget95', label: 'Budget Alert (95%)', desc: 'Notify when 95% of budget is used' },
                        { key: 'notifyBudget100', label: 'Budget Alert (100%)', desc: 'Notify when budget is fully used' },
                        { key: 'notifyDaily', label: t('settings.notifyDaily'), desc: t('settings.notifyDailyDesc') },
                        { key: 'notifyLunch', label: t('settings.notifyLunch'), desc: t('settings.notifyLunchDesc') },
                    ].map((pref) => (
                        <div key={pref.key} className="flex items-start justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2b2616] transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{pref.label}</h4>
                                <p className="text-xs text-slate-500 dark:text-[#cbbc90]">{pref.desc}</p>
                            </div>
                            <button
                                onClick={() => handleUpdatePref(pref.key, !currentUser?.[pref.key])}
                                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${currentUser?.[pref.key] !== false ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${currentUser?.[pref.key] !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!isSupported && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl text-center font-bold">
                    Push notifications are not supported in this browser.
                </div>
            )}
        </div>
    );

    return (
        <PageTransition>
            <div className="flex flex-col md:flex-row h-full min-h-screen bg-slate-50 dark:bg-background-dark">
                {/* Desktop Sidebar (HIDDEN ON MOBILE) */}
                <div className="hidden md:flex flex-col w-64 bg-white dark:bg-[#2b2616] border-r border-slate-200 dark:border-[#493f22] h-screen sticky top-0 overflow-y-auto">
                    <div className="p-6">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
                        <p className="text-xs text-slate-500 dark:text-[#cbbc90] mt-1">{t('settings.subtitle')}</p>
                    </div>
                    <nav className="flex flex-col px-3 gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-slate-900 font-bold shadow-sm'
                                    : 'text-slate-600 dark:text-[#cbbc90] hover:bg-slate-50 dark:hover:bg-[#36301d]'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{tab.icon}</span>
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Mobile Header REMOVED as requested */}

                {/* Main Content Area */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-5xl mx-auto">
                    <ConfirmationModal
                        isOpen={confirmation.isOpen}
                        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                        onConfirm={handleConfirmAction}
                        title={confirmation.title}
                        message={confirmation.message}
                        variant="danger"
                        confirmText={confirmation.type === 'reset_app' ? 'Yes, Reset Everything' : 'Delete'}
                        isLoading={confirmation.isLoading}
                    />

                    <ProfilePictureModal
                        isOpen={isProfileModalOpen}
                        onClose={() => setIsProfileModalOpen(false)}
                        currentUser={currentUser}
                        onUpdate={(newImage) => setCurrentUser((prev: any) => ({ ...prev, image: newImage }))}
                    />

                    {/* DESKTOP CONTENT VIEW */}
                    <div className="hidden md:block">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">{tabs.find(t => t.id === activeTab)?.label}</h1>
                        {activeTab === 'account' && renderAccountContent(false)}
                        {activeTab === 'finance' && renderFinanceContent(false)}
                        {activeTab === 'appearance' && renderAppearanceContent()}
                        {activeTab === 'notifications' && renderNotificationContent()}
                    </div>

                    {/* MOBILE ACCORDION VIEW */}
                    <div className="md:hidden flex flex-col gap-4">
                        {/* Profile Card FIRST (Outside Accordion) */}
                        {renderProfileCard()}

                        {/* Accordions */}
                        {tabs.map(tab => (
                            <div key={tab.id} className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleSection(tab.id)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors ${openSection === tab.id ? 'bg-slate-50 dark:bg-[#2b2616]' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-500 dark:text-[#cbbc90]">{tab.icon}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{tab.label}</span>
                                    </div>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${openSection === tab.id ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>

                                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openSection === tab.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                        <div className="p-4 border-t border-slate-100 dark:border-[#493f22]">
                                            {tab.id === 'account' && renderAccountContent(true)}
                                            {tab.id === 'finance' && renderFinanceContent(true)}
                                            {tab.id === 'appearance' && renderAppearanceContent()}
                                            {tab.id === 'notifications' && renderNotificationContent()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recurring Modal (Global) */}
                {isRecurringModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRecurringModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-[#2a2515] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                            <div className="p-6 border-b border-slate-100 dark:border-[#493f22] flex justify-between items-center bg-surface-light dark:bg-[#342d18]">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('settings.addRecurring')}</h3>
                                <button onClick={() => setIsRecurringModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-[#cbbc90] dark:hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleAddRecurring} className="p-6 flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.name')}</label>
                                    <input
                                        type="text"
                                        value={newRecurring.name}
                                        onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                                        placeholder="e.g. Internet Bill"
                                        className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.amount')}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold">Rp</span>
                                        <CurrencyInput
                                            value={newRecurring.amount}
                                            onChange={(val) => setNewRecurring({ ...newRecurring, amount: val.toString() })}
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.date')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={newRecurring.date}
                                            onChange={(e) => setNewRecurring({ ...newRecurring, date: e.target.value })}
                                            placeholder={t('settings.date')}
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.frequency')}</label>
                                        <select
                                            value={newRecurring.frequency}
                                            onChange={(e) => setNewRecurring({ ...newRecurring, frequency: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        >
                                            <option value="Monthly">{t('settings.monthly')}</option>
                                            <option value="Weekly">{t('settings.weekly')}</option>
                                            <option value="Yearly">{t('settings.yearly')}</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-primary hover:bg-[#dca60e] text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-95">
                                    {t('settings.addTransaction')}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default Settings;
