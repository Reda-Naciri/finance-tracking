export interface User {
  id: number;
  email: string;
  fullName: string;
  password?: string;
}

export interface FinancialAccount {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: number;
  title: string;
  financialAccountId: number;
  categoryId: number;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  createdAt: string;
  financialAccount?: FinancialAccount;
  category?: Category;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  net: number;
}

export interface CategorySpending {
  categoryId: number;
  categoryName: string;
  type: 'income' | 'expense';
  amount: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}
