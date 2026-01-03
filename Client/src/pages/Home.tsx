import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { AccountCard, AddAccountCard } from '@/components/AccountCard';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getFinancialAccounts,
  createFinancialAccount,
  getSummary,
  getFinancialAccountBalance,
} from '@/services/api';
import type { FinancialAccount, MonthlySummary } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (activeAccountId) {
      loadSummary(activeAccountId);
    }
  }, [activeAccountId]);

  const loadAccounts = async () => {
    try {
      const data = await getFinancialAccounts();
      setAccounts(data);
      if (data.length > 0) {
        setActiveAccountId(data[0].id);
        // Load balances for all accounts
        const balancePromises = data.map(async (acc) => ({
          id: acc.id,
          balance: await getFinancialAccountBalance(acc.id),
        }));
        const balanceResults = await Promise.all(balancePromises);
        const balanceMap: Record<number, number> = {};
        balanceResults.forEach((r) => {
          balanceMap[r.id] = r.balance;
        });
        setBalances(balanceMap);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async (accountId: number) => {
    try {
      const data = await getSummary(currentMonth);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return;
    try {
      const newAccount = await createFinancialAccount(newAccountName.trim());
      setAccounts((prev) => [...prev, newAccount]);
      setBalances((prev) => ({ ...prev, [newAccount.id]: 0 }));
      setNewAccountName('');
      setShowAddAccount(false);
      toast({ title: 'Account created' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive',
      });
    }
  };

  const handleQuickAction = (type: 'income' | 'expense') => {
    if (activeAccountId) {
      navigate(`/add-transaction?type=${type}&accountId=${activeAccountId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* Header */}
        <h1 className="mb-6 text-xl font-bold text-foreground">Accounts</h1>

        {/* Total Balance */}
        <div className="mb-6 rounded-lg bg-card p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
          <div className="text-2xl font-bold text-foreground">
            {totalBalance.toLocaleString('fr-MA')} MAD
          </div>
        </div>

        {/* Accounts Carousel */}
        <div
          ref={carouselRef}
          className="mb-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {accounts.map((account) => (
            <div key={account.id} style={{ scrollSnapAlign: 'start' }}>
              <AccountCard
                name={account.name}
                balance={balances[account.id] || 0}
                isActive={account.id === activeAccountId}
                onClick={() => setActiveAccountId(account.id)}
              />
            </div>
          ))}
          <div style={{ scrollSnapAlign: 'start' }}>
            <AddAccountCard onClick={() => setShowAddAccount(true)} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex gap-4">
          <Button
            onClick={() => handleQuickAction('income')}
            className="flex-1 bg-income text-income-foreground hover:bg-income/90"
            disabled={!activeAccountId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Income
          </Button>
          <Button
            onClick={() => handleQuickAction('expense')}
            className="flex-1 bg-expense text-expense-foreground hover:bg-expense/90"
            disabled={!activeAccountId}
          >
            <Minus className="mr-2 h-4 w-4" />
            Expense
          </Button>
        </div>

        {/* Monthly Summary */}
        {summary && (
          <div className="rounded-lg bg-card p-4">
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              {format(new Date(), 'MMMM yyyy')}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Income</span>
                <span className="font-bold text-income">
                  +{summary.totalIncome.toLocaleString('fr-MA')} MAD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expenses</span>
                <span className="font-bold text-expense">
                  -{summary.totalExpenses.toLocaleString('fr-MA')} MAD
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net</span>
                  <span className="text-lg font-bold">
                    {summary.net.toLocaleString('fr-MA')} MAD
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Account name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
            />
            <Button onClick={handleAddAccount} className="w-full">
              Add Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Home;
