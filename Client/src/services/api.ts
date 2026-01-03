import { API_BASE_URL } from '@/config/api';
import type { 
  User, 
  FinancialAccount, 
  Category, 
  Transaction, 
  MonthlySummary, 
  LoginCredentials, 
  AuthResponse,
  CategorySpending
} from '@/types';

const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

// Auth (hardcoded for single user)
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Hardcoded single user auth as per requirements
  if (credentials.email === 'reda_naciri@icloud.com' && credentials.password === '123456789') {
    return { token: 'LOCAL_ACCESS_GRANTED' };
  }
  throw new Error('Invalid credentials');
};

// Financial Accounts
export const getFinancialAccounts = async (): Promise<FinancialAccount[]> => {
  const response = await fetch(`${API_BASE_URL}/financial-accounts`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<FinancialAccount[]>(response);
};

export const createFinancialAccount = async (name: string): Promise<FinancialAccount> => {
  const response = await fetch(`${API_BASE_URL}/financial-accounts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse<FinancialAccount>(response);
};

export const deleteFinancialAccount = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/financial-accounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete financial account: ${response.status}`);
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Category[]>(response);
};

export const createCategory = async (name: string, type: 'income' | 'expense'): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, type }),
  });
  return handleResponse<Category>(response);
};

export const deleteCategory = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.status}`);
  }
};

// Transactions
export const getTransactions = async (financialAccountId?: number, month?: string): Promise<Transaction[]> => {
  const params = new URLSearchParams();
  if (financialAccountId) params.append('financialAccountId', financialAccountId.toString());
  if (month) params.append('month', month);
  
  const response = await fetch(
    `${API_BASE_URL}/transactions?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<Transaction[]>(response);
};

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(transaction),
  });
  return handleResponse<Transaction>(response);
};

// Summary
export const getSummary = async (month: string): Promise<MonthlySummary> => {
  const response = await fetch(
    `${API_BASE_URL}/summary?month=${month}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<MonthlySummary>(response);
};

// Category spending for current month
export const getCategorySpending = async (month: string, financialAccountId?: number): Promise<CategorySpending[]> => {
  const params = new URLSearchParams();
  if (financialAccountId) params.append('financialAccountId', financialAccountId.toString());
  
  const response = await fetch(
    `${API_BASE_URL}/categories/${month}/spending?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<CategorySpending[]>(response);
};

// Get financial account balance (computed by backend)
export const getFinancialAccountBalance = async (financialAccountId: number): Promise<number> => {
  const response = await fetch(
    `${API_BASE_URL}/financial-accounts/${financialAccountId}/balance`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<number>(response);
};

// Get total balance across all financial accounts
export const getTotalBalance = async (): Promise<number> => {
  const response = await fetch(
    `${API_BASE_URL}/total-balance`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<number>(response);
};
