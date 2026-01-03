import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category, CategorySpending } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CategorySelectorProps {
  categories: Category[];
  categorySpending: CategorySpending[];
  selectedId: number | null;
  type: 'income' | 'expense';
  onSelect: (id: number) => void;
  onAddCategory: (name: string) => void;
}

export const CategorySelector = ({
  categories,
  categorySpending,
  selectedId,
  type,
  onSelect,
  onAddCategory,
}: CategorySelectorProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  const getSpending = (categoryId: number) => {
    const spending = categorySpending.find((s) => s.categoryId === categoryId);
    return spending?.amount || 0;
  };

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddDialog(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Category</label>
      <div className="flex flex-wrap gap-2">
        {filteredCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              'flex flex-col rounded-lg border px-3 py-2 text-left transition-colors',
              selectedId === category.id
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-card hover:border-foreground'
            )}
          >
            <span className="text-sm font-medium">{category.name}</span>
            <span className="text-xs opacity-70">
              {getSpending(category.id).toLocaleString('fr-MA')} MAD
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1 rounded-lg border-2 border-dashed border-border px-3 py-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add</span>
        </button>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} className="w-full">
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
