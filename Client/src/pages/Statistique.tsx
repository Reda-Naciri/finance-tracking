import { useState, useEffect } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { BottomNav } from '@/components/BottomNav';
import { getFinancialAccounts, getTransactions, getCategorySpending } from '@/services/api';
import type { FinancialAccount, Transaction, CategorySpending } from '@/types';
import { cn } from '@/lib/utils';

type TimeRange = '7D' | 'Weekly' | '3M' | 'Yearly';

// Luxury color palette for expense categories (pie chart)
const EXPENSE_COLORS = [
  '#1e3a8a',  // Deep Navy Blue
  '#7c2d12',  // Rich Burgundy
  '#065f46',  // Forest Green
  '#701a75',  // Royal Purple
  '#78350f',  // Chocolate Brown
  '#0c4a6e',  // Sapphire Blue
  '#713f12',  // Bronze Gold
  '#4c1d95',  // Deep Violet
  '#164e63',  // Teal
  '#831843',  // Wine Red
];

const Statistique = () => {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number | 'general' | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; amount: number }[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;

  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (activeAccountId) {
      // Add smooth transition effect
      setIsTransitioning(true);

      // Small delay for smooth fade effect
      const timer = setTimeout(() => {
        loadCategorySpending();
        loadTrendData();
        loadTransactions();
        setIsTransitioning(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [activeAccountId, timeRange]);

  const loadAccounts = async () => {
    try {
      const data = await getFinancialAccounts();
      setAccounts(data);
      // Set default to "general" to show all accounts
      setActiveAccountId('general');
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategorySpending = async () => {
    if (!activeAccountId) return;
    try {
      const accountIdParam = activeAccountId === 'general' ? undefined : activeAccountId;
      const data = await getCategorySpending(currentMonth, accountIdParam);
      setCategorySpending(data.filter((c) => c.amount > 0));
    } catch (error) {
      console.error('Failed to load category spending:', error);
    }
  };

  const loadTransactions = async () => {
    if (!activeAccountId) return;
    try {
      const accountIdParam = activeAccountId === 'general' ? undefined : activeAccountId;
      const data = await getTransactions(accountIdParam, currentMonth);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadTrendData = async () => {
    if (!activeAccountId) return;
    try {
      // Fetch all transactions and aggregate by date based on time range
      const accountIdParam = activeAccountId === 'general' ? undefined : activeAccountId;
      const transactions = await getTransactions(accountIdParam, currentMonth);
      const expenseTransactions = transactions.filter((t) => t.type === 'expense');

      // Group by date
      const groupedByDate: Record<string, number> = {};
      expenseTransactions.forEach((tx) => {
        const dateKey = tx.date;
        groupedByDate[dateKey] = (groupedByDate[dateKey] || 0) + tx.amount;
      });

      // Generate trend data based on time range
      const today = new Date();
      let dates: Date[] = [];

      switch (timeRange) {
        case '7D':
          dates = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
          break;
        case 'Weekly':
          dates = Array.from({ length: 4 }, (_, i) => subDays(today, (3 - i) * 7));
          break;
        case '3M':
          dates = Array.from({ length: 3 }, (_, i) => subMonths(today, 2 - i));
          break;
        case 'Yearly':
          dates = Array.from({ length: 12 }, (_, i) => subMonths(today, 11 - i));
          break;
      }

      const trend = dates.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        return {
          date: format(d, timeRange === '7D' ? 'EEE' : timeRange === 'Yearly' ? 'MMM' : 'MMM dd'),
          amount: groupedByDate[dateStr] || 0,
        };
      });

      setTrendData(trend);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    }
  };

  const totalExpenses = categorySpending.reduce((sum, c) => sum + c.amount, 0);

  // Pagination calculations - Sort from latest to oldest
  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when account changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeAccountId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md px-4 py-6">
        <h1 className="mb-6 text-xl font-bold text-foreground">Statistique</h1>

        {/* Account Selector */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveAccountId('general')}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeAccountId === 'general'
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground'
            )}
          >
            General
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setActiveAccountId(account.id)}
              className={cn(
                'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                account.id === activeAccountId
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground'
              )}
            >
              {account.name}
            </button>
          ))}
        </div>

        {/* Expense Pie Chart */}
        <div className="mb-8 rounded-lg bg-card p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Expenses by Category
          </h2>
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: isTransitioning ? 0.3 : 1,
              transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            {categorySpending.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySpending}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {categorySpending.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {categorySpending.map((category, index) => (
                    <div key={category.categoryId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full transition-colors duration-300"
                          style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                        />
                        <span className="text-sm">{category.categoryName}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {category.amount.toLocaleString('fr-MA')} MAD
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                No expenses this month
              </div>
            )}
          </div>
        </div>

        {/* Spending Trend Chart */}
        <div className="mb-8 rounded-lg bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Spending Trend</h2>
            <div className="flex gap-1">
              {(['7D', 'Weekly', '3M', 'Yearly'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium transition-colors',
                    timeRange === range
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div
            className="h-48 transition-all duration-300 ease-in-out"
            style={{
              opacity: isTransitioning ? 0.3 : 1,
              transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-MA')} MAD`, 'Expenses']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={false}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-lg bg-card p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Recent Transactions
          </h2>
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: isTransitioning ? 0.3 : 1,
              transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            {transactions.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-2 pb-3 mb-2 text-xs font-semibold text-muted-foreground border-b border-border">
                <div>Date</div>
                <div>Title</div>
                <div className="text-right">Expense</div>
                <div className="text-right">Income</div>
              </div>

              {/* Table Body */}
              <div className="space-y-2">
                {currentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-4 gap-2 py-2 text-sm border-b border-border last:border-b-0"
                  >
                    {/* Date Column */}
                    <div className="text-muted-foreground">
                      {format(new Date(transaction.date), 'dd/MM')}
                    </div>

                    {/* Title Column */}
                    <div className="col-span-1 truncate">
                      {transaction.title || transaction.category?.name || 'Unknown'}
                    </div>

                    {/* Expense Column */}
                    <div className="text-right">
                      {transaction.type === 'expense' ? (
                        <span className="text-red-500 font-medium">
                          -{transaction.amount.toLocaleString('fr-MA')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Income Column */}
                    <div className="text-right">
                      {transaction.type === 'income' ? (
                        <span className="text-green-500 font-medium">
                          +{transaction.amount.toLocaleString('fr-MA')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      'px-3 py-1 text-sm rounded',
                      currentPage === 1
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    Previous
                  </button>

                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      'px-3 py-1 text-sm rounded',
                      currentPage === totalPages
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              No transactions this month
            </div>
          )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Statistique;
