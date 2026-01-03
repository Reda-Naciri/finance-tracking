import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Trash2 } from 'lucide-react';
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
  deleteFinancialAccount,
  getCategories,
  createCategory,
  deleteCategory,
  getFinancialAccountBalance,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { FinancialAccount, Category } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Settings = () => {
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        getFinancialAccounts(),
        getCategories(),
      ]);
      setFinancialAccounts(accountsData);
      setCategories(categoriesData);

      // Load balances
      const balancePromises = accountsData.map(async (acc) => ({
        id: acc.id,
        balance: await getFinancialAccountBalance(acc.id),
      }));
      const balanceResults = await Promise.all(balancePromises);
      const balanceMap: Record<number, number> = {};
      balanceResults.forEach((r) => {
        balanceMap[r.id] = r.balance;
      });
      setBalances(balanceMap);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return;
    try {
      const newAccount = await createFinancialAccount(newAccountName.trim());
      setFinancialAccounts((prev) => [...prev, newAccount]);
      setBalances((prev) => ({ ...prev, [newAccount.id]: 0 }));
      setNewAccountName('');
      setShowAddAccount(false);
      toast({ title: 'Financial Account created' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create financial account',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      await deleteFinancialAccount(id);
      setFinancialAccounts((prev) => prev.filter(acc => acc.id !== id));
      setBalances((prev) => {
        const newBalances = { ...prev };
        delete newBalances[id];
        return newBalances;
      });
      toast({ title: 'Financial Account deleted' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Cannot delete default financial accounts',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await createCategory(newCategoryName.trim(), newCategoryType);
      setCategories((prev) => [...prev, newCategory]);
      setNewCategoryName('');
      setShowAddCategory(false);
      toast({ title: 'Category created' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter(cat => cat.id !== id));
      toast({ title: 'Category deleted - transactions moved to "Other"' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Cannot delete "Other" categories',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

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
        <h1 className="mb-6 text-xl font-bold text-foreground">Settings</h1>

        {/* Financial Accounts Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-foreground">Financial Accounts</h2>
            <button
              onClick={() => setShowAddAccount(true)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {financialAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg bg-card p-4"
              >
                <div className="flex-1">
                  <span className="font-medium">{account.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {(balances[account.id] || 0).toLocaleString('fr-MA')} MAD
                  </span>
                  {account.id > 3 && (
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-foreground">Categories</h2>
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Income Categories */}
          <div className="mb-4">
            <h3 className="mb-2 text-sm text-income">Income</h3>
            <div className="flex flex-wrap gap-2">
              {incomeCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm"
                >
                  <span>{category.name}</span>
                  {category.id !== 7 && (
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <span className="text-sm text-muted-foreground">No income categories</span>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <h3 className="mb-2 text-sm text-expense">Expense</h3>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm"
                >
                  <span>{category.name}</span>
                  {category.id !== 6 && (
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <span className="text-sm text-muted-foreground">No expense categories</span>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Add Financial Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Financial Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Account name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
            />
            <Button onClick={handleAddAccount} className="w-full">
              Add Financial Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewCategoryType('income')}
                className={cn(
                  'flex-1 rounded-lg py-3 text-sm font-medium transition-colors',
                  newCategoryType === 'income'
                    ? 'bg-income text-income-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setNewCategoryType('expense')}
                className={cn(
                  'flex-1 rounded-lg py-3 text-sm font-medium transition-colors',
                  newCategoryType === 'expense'
                    ? 'bg-expense text-expense-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                Expense
              </button>
            </div>
            <Button onClick={handleAddCategory} className="w-full">
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Settings;
