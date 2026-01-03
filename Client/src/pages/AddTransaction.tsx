import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CategorySelector } from '@/components/CategorySelector';
import {
  getCategories,
  createCategory,
  createTransaction,
  getCategorySpending,
} from '@/services/api';
import type { Category, CategorySpending } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const AddTransaction = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialType = (searchParams.get('type') as 'income' | 'expense') || 'expense';
  const accountId = Number(searchParams.get('accountId'));

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    loadCategories();
    if (accountId) {
      loadCategorySpending();
    }
  }, [accountId]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadCategorySpending = async () => {
    try {
      const data = await getCategorySpending(currentMonth, accountId);
      setCategorySpending(data);
    } catch (error) {
      console.error('Failed to load category spending:', error);
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const newCategory = await createCategory(name, type);
      setCategories((prev) => [...prev, newCategory]);
      setCategoryId(newCategory.id);
      toast({ title: 'Category created' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !amount || !categoryId || !accountId) {
      toast({
        title: 'Missing fields',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await createTransaction({
        financialAccountId: accountId,
        categoryId,
        amount: parseFloat(amount),
        type,
        date: format(date, 'yyyy-MM-dd'),
        title: title.trim(),
      });
      toast({ title: 'Transaction added' });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Add Transaction</h1>
        </div>

        <div className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <Input
              type="text"
              placeholder="Enter transaction title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Amount (MAD)
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-16 text-center text-3xl font-bold"
            />
          </div>

          {/* Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  'flex-1 rounded-lg py-3 text-sm font-medium transition-colors',
                  type === 'income'
                    ? 'bg-income text-income-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  'flex-1 rounded-lg py-3 text-sm font-medium transition-colors',
                  type === 'expense'
                    ? 'bg-expense text-expense-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <CategorySelector
            categories={categories}
            categorySpending={categorySpending}
            selectedId={categoryId}
            type={type}
            onSelect={setCategoryId}
            onAddCategory={handleAddCategory}
          />

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {format(date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-12 w-full text-lg font-medium"
          >
            {isLoading ? 'Adding...' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
