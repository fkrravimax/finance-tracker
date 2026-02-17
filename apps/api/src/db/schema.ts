import { pgTable, text, timestamp, boolean, uuid, integer, decimal, index } from "drizzle-orm/pg-core";

// --- Auth Tables (Better Auth) ---

export const users = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    role: text("role").default("USER").notNull(),
    plan: text("plan").default("FREE").notNull(),
    notifyBudget50: boolean("notify_budget_50").default(true),
    notifyBudget80: boolean("notify_budget_80").default(true),
    notifyBudget95: boolean("notify_budget_95").default(true),
    notifyBudget100: boolean("notify_budget_100").default(true),
    notifyDaily: boolean("notify_daily").default(false),
    notifyLunch: boolean("notify_lunch").default(true),
    notifyRecurring: boolean("notify_recurring").default(true),
    notifyInfo: boolean("notify_info").default(true),
    tradingBalance: text("trading_balance").default("0").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    lastActiveAt: timestamp("last_active_at"),
});

export const sessions = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => users.id),
}, (table) => {
    return {
        userIdIdx: index("session_user_id_idx").on(table.userId),
    };
});

export const accounts = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => users.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
}, (table) => {
    return {
        userIdIdx: index("account_user_id_idx").on(table.userId),
    };
});

export const verifications = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

// --- Finance App Tables ---

export const wallets = pgTable("wallet", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    name: text("name").notNull(), // Encrypted
    type: text("type").notNull(), // 'BANK', 'CASH', 'E_WALLET', 'OTHER'
    balance: text("balance").default("0").notNull(), // Encrypted
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("wallet_user_id_idx").on(table.userId),
    };
});

// Update transactions table to include walletId
export const transactions = pgTable("transaction", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    walletId: uuid("wallet_id").references(() => wallets.id), // Nullable for migration
    merchant: text("merchant").notNull(), // Encrypted
    category: text("category").notNull(),
    date: timestamp("date").notNull(),
    amount: text("amount").notNull(), // Encrypted
    type: text("type").notNull(),
    icon: text("icon"),
    description: text("description"), // Encrypted
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("transaction_user_id_idx").on(table.userId),
        walletIdIdx: index("transaction_wallet_id_idx").on(table.walletId),
        dateIdx: index("transaction_date_idx").on(table.date),
    };
});

export const savingsGoals = pgTable("savings_goal", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    name: text("name").notNull(), // Encrypted
    targetAmount: text("target_amount").notNull(), // Encrypted
    currentAmount: text("current_amount").default("0").notNull(), // Encrypted
    targetDate: timestamp("target_date").notNull(),
    category: text("category").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("savings_goal_user_id_idx").on(table.userId),
    };
});

export const budgets = pgTable("budget", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    name: text("name").notNull(),
    limit: text("limit").notNull(), // Encrypted
    icon: text("icon"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("budget_user_id_idx").on(table.userId),
    };
});

export const recurringTransactions = pgTable("recurring_transaction", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    name: text("name").notNull(), // Encrypted
    amount: text("amount").notNull(), // Encrypted
    frequency: text("frequency").notNull(),
    date: integer("date").notNull(),
    icon: text("icon"),
    nextDueDate: timestamp("next_due_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("recurring_transaction_user_id_idx").on(table.userId),
    };
});

export const trades = pgTable("trade", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    pair: text("pair").notNull(),
    type: text("type").notNull(),
    amount: text("amount").notNull(), // Encrypted
    entryPrice: text("entry_price").notNull(), // Encrypted
    closePrice: text("close_price"), // Encrypted
    leverage: integer("leverage").notNull(),
    pnl: text("pnl"), // Encrypted
    outcome: text("outcome"),
    status: text("status").notNull().default("OPEN"),
    notes: text("notes"), // Encrypted
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("trade_user_id_idx").on(table.userId),
    };
});

// --- Upgrade Requests Table ---

export const upgradeRequests = pgTable("upgrade_request", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    currentPlan: text("current_plan").notNull(),
    requestedPlan: text("requested_plan").notNull(),
    status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("upgrade_request_user_id_idx").on(table.userId),
    };
});

// --- Push Subscriptions Table ---

export const pushSubscriptions = pgTable("push_subscription", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("push_subscription_user_id_idx").on(table.userId),
    };
});

// --- Notifications Table ---

export const notifications = pgTable("notification", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(), // 'bill', 'budget', 'market', 'security', 'info', 'success', 'warning'
    isRead: boolean("is_read").default(false).notNull(),
    metadata: text("metadata"), // JSON stringified extra data
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("notification_user_id_idx").on(table.userId),
    };
});

// --- Watchlists Table ---

export const watchlists = pgTable("watchlist", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    symbol: text("symbol").notNull(), // e.g., 'BTC', 'ETH'
    lastPrice: text("last_price"), // Encrypted snapshot for comparison
    lastCheckedAt: timestamp("last_checked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Aggregates Tables (Encrypted Client-Side) ---

export const monthlyAggregates = pgTable("monthly_aggregate", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    monthKey: text("month_key").notNull(), // Format: "YYYY-MM"
    income: text("income").notNull(), // Encrypted
    expense: text("expense").notNull(), // Encrypted
    version: integer("version").default(1).notNull(), // For optimistic concurrency
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("monthly_agg_user_id_idx").on(table.userId),
        monthKeyIdx: index("monthly_agg_month_key_idx").on(table.monthKey),
        uniqueUserMonth: index("monthly_agg_unique_idx").on(table.userId, table.monthKey), // Should be unique ideally
    };
});

export const dailyAggregates = pgTable("daily_aggregate", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    dayKey: text("day_key").notNull(), // Format: "YYYY-MM-DD"
    income: text("income").notNull(), // Encrypted
    expense: text("expense").notNull(), // Encrypted
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("daily_agg_user_id_idx").on(table.userId),
        dayKeyIdx: index("daily_agg_day_key_idx").on(table.dayKey),
        uniqueUserDay: index("daily_agg_unique_idx").on(table.userId, table.dayKey),
    };
});

export const categoryAggregates = pgTable("category_aggregate", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    monthKey: text("month_key").notNull(), // Format: "YYYY-MM"
    category: text("category").notNull(),
    type: text("type").notNull(), // 'income' | 'expense'
    amount: text("amount").notNull(), // Encrypted
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index("category_agg_user_id_idx").on(table.userId),
        monthKeyIdx: index("category_agg_month_key_idx").on(table.monthKey),
        uniqueUserCategory: index("category_agg_unique_idx").on(table.userId, table.monthKey, table.category, table.type),
    };
});
