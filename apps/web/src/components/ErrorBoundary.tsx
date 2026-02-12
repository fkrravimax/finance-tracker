import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[60vh] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-[#342d18] rounded-2xl border border-slate-100 dark:border-[#493f22] shadow-xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-red-500 dark:text-red-400">
                                error
                            </span>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-[#cbbc90] mb-6 leading-relaxed">
                            An unexpected error occurred. Please try again or refresh the page.
                        </p>

                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-slate-400 dark:text-[#9a8b63] cursor-pointer hover:text-slate-600 dark:hover:text-[#cbbc90] transition-colors">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-50 dark:bg-[#2b2616] rounded-xl text-xs text-red-500 dark:text-red-400 overflow-auto max-h-32 border border-slate-200 dark:border-[#493f22]">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#493f22] text-sm font-bold text-slate-600 dark:text-[#cbbc90] hover:bg-slate-50 dark:hover:bg-[#2b2616] transition-colors"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={this.handleRetry}
                                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
