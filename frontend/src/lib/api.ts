const API_BASE_URL = 'http://localhost:8000';

export interface User {
  id: number;
  name: string;
  email: string;
  allowance?: number;
}

export interface UserCreate {
  name: string;
  email: string;
  allowance?: number;
}

export interface Expense {
  id: number;
  amount: number;
  title: string;
  notes?: string;
  category?: string;
  date: string;
  created_at: string;
  user_id: number;
}

export interface ExpenseCreate {
  amount: number;
  title: string;
  notes?: string;
  category?: string;
  date: string;
}

export interface AnalyticsData {
  user_id: number;
  name: string;
  allowance: number;
  expected_spend: number;
  actual_spend: number;
  savings: number;
  days_counted: number;
  overspend_days: number;
  by_category: Record<string, number>;
  ai_insight: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other issues
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// User API
export const userApi = {
  create: (userData: UserCreate): Promise<User> => 
    apiRequest<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  list: (): Promise<User[]> => 
    apiRequest<User[]>('/users/'),
};

// Expense API
export const expenseApi = {
  create: (userId: number, expenseData: ExpenseCreate): Promise<Expense> => 
    apiRequest<Expense>(`/expenses/?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  list: (userId: number): Promise<Expense[]> => 
    apiRequest<Expense[]>(`/expenses/?user_id=${userId}`),
};

// Analytics API
export const analyticsApi = {
  getAnalytics: (userId: number, dateFrom?: string, dateTo?: string): Promise<AnalyticsData> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<AnalyticsData>(`/analytics/${userId}${query}`);
  },
};