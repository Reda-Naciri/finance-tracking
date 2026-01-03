import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface AccountCardProps {
  name: string;
  balance: number;
  isActive: boolean;
  onClick: () => void;
}

export const AccountCard = ({ name, balance, isActive, onClick }: AccountCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-24 min-w-[160px] flex-col justify-between rounded-lg p-4 text-left transition-all',
        isActive
          ? 'bg-foreground text-background'
          : 'bg-card text-card-foreground'
      )}
    >
      <span className="text-sm font-medium">{name}</span>
      <span className="text-xl font-bold">
        {balance.toLocaleString('fr-MA')} MAD
      </span>
    </button>
  );
};

interface AddAccountCardProps {
  onClick: () => void;
}

export const AddAccountCard = ({ onClick }: AddAccountCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex h-24 min-w-[160px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      <Plus className="h-6 w-6" />
      <span className="text-sm">Add Account</span>
    </button>
  );
};
