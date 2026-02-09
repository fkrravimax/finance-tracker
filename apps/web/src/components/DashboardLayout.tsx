import React from 'react';
import Sidebar from './Sidebar';
import BottomNavbar from './BottomNavbar';
import QuickAddTransactionModal from './QuickAddTransactionModal';
import { UIProvider, useUI } from '../contexts/UIContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
}

const DashboardContent: React.FC<DashboardLayoutProps> = ({ children, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const { isQuickAddOpen, closeQuickAdd } = useUI();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white relative">
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col w-full max-w-full pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0">
                {/* Mobile Header (Visible only on small screens) */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5 bg-surface-light dark:bg-background-dark sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/30 transform rotate-3">
                            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                        </span>
                        <span className="font-black text-xl tracking-tight text-slate-800 dark:text-white">Rupiku</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#2b2616] rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
                {children}
            </main>

            <BottomNavbar />

            <QuickAddTransactionModal
                isOpen={isQuickAddOpen}
                onClose={closeQuickAdd}
            />
        </div>
    );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
    return (
        <UIProvider>
            <DashboardContent {...props} />
        </UIProvider>
    );
};

export default DashboardLayout;
