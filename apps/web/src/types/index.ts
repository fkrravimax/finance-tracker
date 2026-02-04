// Core Entity Types

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    userId: string;
    merchant: string;
    category: string;
    date: string; // ISO Date string
    amount: number;
    type: TransactionType;
    icon: string;
    description?: string;
}

export interface SavingsGoal {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    category: string;
    image: string;
}

export interface BudgetCategory {
    id: string;
    userId: string;
    name: string;
    limit: number;
    icon: string;
}

export interface RecurringTransaction {
    id: string;
    userId: string;
    name: string;
    amount: number;
    frequency: 'Monthly' | 'Weekly' | 'Yearly';
    date: number; // Day of month/week
    icon: string;
    nextDueDate?: string;
}

// API Response Wrappers (if needed for standard envelopes)
export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}
