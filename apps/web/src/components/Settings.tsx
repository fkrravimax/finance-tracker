import React, { useState, useEffect } from 'react';
import { settingsService, type RecurringTransaction } from '../services/settingsService';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';
import CurrencyInput from './CurrencyInput';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import ConfirmationModal from './ConfirmationModal';

import { useNotification } from '../contexts/NotificationContext';

const Settings: React.FC = () => {
    const { theme, setTheme, privacyMode, setPrivacyMode } = useAppearance();
    const { language, setLanguage, t } = useLanguage();
    const [budgetLimit, setBudgetLimit] = useState('');
    const [loading, setLoading] = useState(false);

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
                // If user has no password (e.g. Google only), hide specific settings.
                // Note: Better Auth session object doesn't always strictly say "hasPassword".
                // But typically, if they logged in via social, we might want to hide it.
                // Assuming we can't easily detecting "hasPassword" from client without API,
                // we will rely on user feedback or a future API field.
                // For now, let's keep it visible but maybe show a note if using Google?
                // OR, checking `sessionCtx.user.image` which is common for Google users? No, unreliable.

                // Inspecting the user object structure might help.
                // Inspecting the user object structure might help.
                if (sessionCtx.data) {
                    // console.log("Session Data", sessionCtx.data);
                    // Set initial name form value
                    setNameForm({ name: sessionCtx.data.user.name || '' });
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

    // Accordion State
    const [openSection, setOpenSection] = useState<string | null>(''); // Default open 'account'

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

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
    const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
    const [nameForm, setNameForm] = useState({ name: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isChangingEmail, setIsChangingEmail] = useState(false);
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

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsChangingEmail(true);
        try {
            await authClient.changeEmail({
                newEmail: emailForm.newEmail,
                // password removed based on better-auth capabilities (might need callbackURL or verification)
            });
            showNotification("Email update initiated! Please check your new email for verification.");
            setEmailForm({ newEmail: '', password: '' });
        } catch (error: any) {
            console.error("Failed to update email", error);
            showNotification(error.message || "Failed to update email", 'error');
        } finally {
            setIsChangingEmail(false);
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
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.name = nameForm.name;
            localStorage.setItem('user', JSON.stringify(currentUser));

            // Reload to reflect changes in dashboard (since Dashboard might read from local storage or context)
            // Or typically, context updates automatically. But for safety:
            window.location.reload();
        } catch (error: any) {
            console.error("Failed to update name", error);
            showNotification(error.message || "Failed to update name", 'error');
        } finally {
            setIsUpdatingName(false);
        }
    };

    // Handlers


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
                // Optional: success alert or toast here
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

    // Removed handleResetApp in favor of handleResetAppClick & handleConfirmAction

    return (
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8 relative">
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


            {/* Add Recurring Modal */}
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

            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
                <p className="text-slate-500 dark:text-[#cbbc90] text-base">{t('settings.subtitle')}</p>
            </div>

            {/* Accordion Categories */}
            <div className="flex flex-col gap-4">

                {/* Appearance Category */}
                <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] overflow-hidden shadow-sm">
                    <button
                        onClick={() => toggleSection('appearance')}
                        className="w-full flex items-center justify-between p-6 bg-surface-light dark:bg-[#2b2616] hover:bg-slate-50 dark:hover:bg-[#36301d] transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">palette</span>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.appearance')}</h2>
                                <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('settings.appearanceDesc')}</p>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${openSection === 'appearance' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {openSection === 'appearance' && (
                        <div className="p-6 border-t border-slate-100 dark:border-[#493f22] flex flex-col gap-8 animate-fade-in">

                            {/* Theme Selection */}
                            <div className="flex flex-col gap-3">
                                <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.theme')}</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['light', 'dark', 'system'] as const).map((themeOption) => (
                                        <button
                                            key={themeOption}
                                            onClick={() => setTheme(themeOption)}
                                            className={`
                                                flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                                                ${theme === themeOption
                                                    ? 'bg-primary text-slate-900 border-primary font-bold shadow-md'
                                                    : 'bg-slate-50 dark:bg-[#1a160b] border-slate-200 dark:border-[#493f22] text-slate-600 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#493f22]/50'
                                                }
                                            `}
                                        >
                                            <span className="material-symbols-outlined">
                                                {themeOption === 'light' ? 'light_mode' : themeOption === 'dark' ? 'dark_mode' : 'settings_brightness'}
                                            </span>
                                            <span className="capitalize text-sm">{t(`settings.${themeOption}` as any)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language Selection */}
                            <div className="flex flex-col gap-3">
                                <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.language')}</h3>
                                <div className="relative">
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value as 'en' | 'id')}
                                        className="w-full md:w-auto bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-3 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none cursor-pointer font-medium"
                                    >
                                        <option value="en">🇺🇸 {t('settings.english')}</option>
                                        <option value="id">🇮🇩 {t('settings.indonesian')}</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {/* Privacy Mode Selection */}
                            <div className="flex flex-col gap-3">
                                <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.hideBalance')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setPrivacyMode('none')}
                                        className={`
                                            flex items-center gap-3 p-4 rounded-xl border transition-all text-left
                                            ${privacyMode === 'none'
                                                ? 'bg-primary text-slate-900 border-primary font-bold shadow-md'
                                                : 'bg-slate-50 dark:bg-[#1a160b] border-slate-200 dark:border-[#493f22] text-slate-600 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#493f22]/50'
                                            }
                                        `}
                                    >
                                        <span className="material-symbols-outlined">visibility</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{t('settings.showAll')}</span>
                                            <span className="text-xs opacity-80">{t('settings.defaultVisibility')}</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setPrivacyMode('hidden')}
                                        className={`
                                            flex items-center gap-3 p-4 rounded-xl border transition-all text-left
                                            ${privacyMode === 'hidden'
                                                ? 'bg-primary text-slate-900 border-primary font-bold shadow-md'
                                                : 'bg-slate-50 dark:bg-[#1a160b] border-slate-200 dark:border-[#493f22] text-slate-600 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#493f22]/50'
                                            }
                                        `}
                                    >
                                        <span className="material-symbols-outlined">visibility_off</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{t('settings.softHide')}</span>
                                            <span className="text-xs opacity-80">{t('settings.hideTotalBalance')}</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setPrivacyMode('extreme')}
                                        className={`
                                            flex items-center gap-3 p-4 rounded-xl border transition-all text-left
                                            ${privacyMode === 'extreme'
                                                ? 'bg-primary text-slate-900 border-primary font-bold shadow-md'
                                                : 'bg-slate-50 dark:bg-[#1a160b] border-slate-200 dark:border-[#493f22] text-slate-600 dark:text-[#cbbc90] hover:bg-slate-100 dark:hover:bg-[#493f22]/50'
                                            }
                                        `}
                                    >
                                        <span className="material-symbols-outlined">password</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{t('settings.extremeHide')}</span>
                                            <span className="text-xs opacity-80">{t('settings.hideAllNumbers')}</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Privacy Policy Link */}
                            <div className="flex flex-col gap-3">
                                <h3 className="font-bold text-slate-900 dark:text-white">{t('privacy.title')}</h3>
                                <Link to="/privacy" className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] hover:border-primary/50 hover:bg-white dark:hover:bg-[#2b2616] transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2b2616] flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                            <span className="material-symbols-outlined text-slate-500 dark:text-[#cbbc90] group-hover:text-primary">verified_user</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary">{t('privacy.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-[#cbbc90]">View our privacy policy</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Category */}
                <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] overflow-hidden shadow-sm">
                    <button
                        onClick={() => toggleSection('account')}
                        className="w-full flex items-center justify-between p-6 bg-surface-light dark:bg-[#2b2616] hover:bg-slate-50 dark:hover:bg-[#36301d] transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">manage_accounts</span>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.account')}</h2>
                                <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('settings.accountDesc')}</p>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${openSection === 'account' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {openSection === 'account' && (
                        <div className="p-6 border-t border-slate-100 dark:border-[#493f22] flex flex-col gap-8 animate-fade-in">
                            {/* Account Management Content */}
                            <div className="flex flex-col gap-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm text-blue-600 dark:text-blue-400">
                                    <strong>Note:</strong> {t('settings.googleNote')}
                                </div>

                                {/* Profile Name */}
                                <form onSubmit={handleUpdateName} className="flex flex-col gap-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#493f22] pb-2">{t('settings.profileDetails')}</h3>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.displayName')}</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                value={nameForm.name}
                                                onChange={e => setNameForm({ ...nameForm, name: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={isUpdatingName}
                                                className="whitespace-nowrap bg-slate-900 dark:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
                                            >
                                                {isUpdatingName ? t('common.loading') : t('common.save')}
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                {/* Change Password */}
                                <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#493f22] pb-2">{t('settings.changePassword')}</h3>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="password"
                                            placeholder={t('settings.currentPassword')}
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm"
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder={t('settings.newPassword')}
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm"
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder={t('settings.confirmPassword')}
                                            value={passwordForm.confirmPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isChangingPassword}
                                            className="bg-slate-900 dark:bg-slate-700 text-white font-bold py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
                                        >
                                            {isChangingPassword ? t('common.loading') : t('settings.updatePassword')}
                                        </button>
                                    </div>
                                </form>

                                {/* Change Email */}
                                <form onSubmit={handleChangeEmail} className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-[#493f22]">
                                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#493f22] pb-2">{t('settings.changeEmail')}</h3>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="email"
                                            placeholder={t('settings.newEmail')}
                                            value={emailForm.newEmail}
                                            onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm"
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="Current Password (to verify)"
                                            value={emailForm.password}
                                            onChange={e => setEmailForm({ ...emailForm, password: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl px-4 py-2 text-sm"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isChangingEmail}
                                            className="bg-slate-900 dark:bg-slate-700 text-white font-bold py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
                                        >
                                            {isChangingEmail ? t('common.loading') : t('settings.updateEmail')}
                                        </button>
                                    </div>
                                </form>

                                {/* Danger Zone */}
                                <div className="pt-8 border-t border-slate-200 dark:border-[#493f22]">
                                    <div className="flex flex-col gap-2">
                                        <div className="pb-8 mb-8 border-b border-slate-100 dark:border-[#493f22]">
                                            <Link to="/privacy" className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#1a160b] border border-slate-100 dark:border-[#493f22] hover:border-primary/50 hover:bg-white dark:hover:bg-[#2b2616] transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-slate-500 dark:text-[#cbbc90] group-hover:text-primary">verified_user</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary">{t('privacy.title')}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                                            </Link>
                                        </div>

                                        <h3 className="font-bold text-slate-900 dark:text-white">{t('settings.dangerZone')}</h3>
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 gap-4 md:gap-0">
                                            <div>
                                                <p className="font-bold text-red-700 dark:text-red-400">{t('settings.resetAllData')}</p>
                                                <p className="text-xs text-red-600/70 dark:text-red-400/70">{t('settings.resetWarning')}</p>
                                            </div>
                                            <button
                                                onClick={handleResetAppClick}
                                                className="w-full md:w-auto px-4 py-2 bg-white dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                            >
                                                {t('settings.resetApp')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Features Category */}
                <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] overflow-hidden shadow-sm">
                    <button
                        onClick={() => toggleSection('features')}
                        className="w-full flex items-center justify-between p-6 bg-surface-light dark:bg-[#2b2616] hover:bg-slate-50 dark:hover:bg-[#36301d] transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">extension</span>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.features')}</h2>
                                <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('settings.featuresDesc')}</p>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${openSection === 'features' ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {openSection === 'features' && (
                        <div className="p-6 border-t border-slate-100 dark:border-[#493f22] flex flex-col gap-8 animate-fade-in">
                            {/* Global Monthly Budget */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
                                    <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                                    <h2>Monthly Budget</h2>
                                </div>
                                <div className="bg-slate-50 dark:bg-[#2b2616] rounded-xl border border-slate-100 dark:border-[#493f22] p-6 flex flex-col gap-4">
                                    <p className="text-sm text-slate-500 dark:text-[#cbbc90]">{t('settings.budgetDescription')}</p>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-[#cbbc90]">{t('settings.budgetLimit')}</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold">Rp</span>
                                            <CurrencyInput
                                                value={budgetLimit}
                                                onChange={(val) => setBudgetLimit(val.toString())}
                                                placeholder="e.g. 5.000.000"
                                                className="w-full bg-white dark:bg-[#1a160b] border border-slate-200 dark:border-[#493f22] rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold text-lg"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveBudget}
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-[#dca60e] text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary/25 active:scale-95 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? t('common.loading') : t('settings.saveBudget')}
                                    </button>
                                </div>
                            </div>

                            {/* Recurring Transactions (Full Width) */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
                                    <span className="material-symbols-outlined text-primary">update</span>
                                    <h2>{t('settings.recurringTransactions')}</h2>
                                </div>
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {recurringTransactions.map(trans => (
                                            <div key={trans.id} className="p-4 rounded-xl border border-slate-100 dark:border-[#493f22] flex flex-col gap-3 hover:shadow-md transition-all hover:border-primary/50 relative group bg-white dark:bg-[#1a160b]">
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
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{trans.name}</h3>
                                                    <p className="text-primary font-bold">{formatCurrency(trans.amount)}</p>
                                                </div>
                                                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-[#493f22] flex items-center gap-2 text-xs text-slate-500 dark:text-[#cbbc90]">
                                                    <span className="material-symbols-outlined text-[16px]">event_repeat</span>
                                                    <span>Every {trans.date}th of {trans.frequency.toLowerCase()}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add New Button */}
                                        <button
                                            onClick={() => setIsRecurringModalOpen(true)}
                                            className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-[#493f22] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary hover:bg-slate-50 dark:hover:bg-[#493f22]/30 transition-all min-h-[160px]"
                                        >
                                            <span className="material-symbols-outlined text-3xl">add_circle</span>
                                            <span className="font-bold">{t('settings.addRecurring')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
