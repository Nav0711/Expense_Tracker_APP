// src/lib/api.ts  (or wherever you keep it)
const API_BASE_URL = "http://localhost:8000";

export interface User {
  id: number;
  name: string;
  email: string;
  clerk_id: string;
  allowance: number;
}

export interface UserCreate {
  name: string;
  email: string;
  clerk_id: string;
  allowance?: number;
}

export interface Expense {
  id: number;
  amount: number;
  title: string;
  notes?: string;
  category?: string;
  date: string;
  created_at?: string;
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
    this.name = "ApiError";
  }
}

/**
 * Read auth token (if any) from localStorage. Adjust key if you store it differently.
 */
function getAuthToken(): string | null {
  return localStorage.getItem("access_token") || null;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  // Build headers (ensure JSON header if body is JSON string)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Try to parse JSON body (if any)
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!response.ok) {
      // Try to extract error from JSON body (many FastAPI errors put detail/description)
      let errMsg = response.statusText;
      try {
        if (isJson) {
          const errBody = await response.json();
          // common shapes: { detail: "..."} or { error: "..."} or {message: "..."}
          errMsg = errBody.detail || errBody.error || errBody.message || JSON.stringify(errBody);
        } else {
          const text = await response.text();
          if (text) errMsg = text;
        }
      } catch (parseErr) {
        // ignore parse error, keep statusText
      }
      throw new ApiError(response.status, errMsg);
    }

    // If no content, return empty (e.g., 204)
    if (response.status === 204) {
      // @ts-ignore
      return null;
    }

    if (isJson) {
      return (await response.json()) as T;
    } else {
      // return raw text as fallback
      // @ts-ignore
      return (await response.text()) as T;
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // network error (ECONNREFUSED etc)
    throw new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ----------------- API functions -----------------

export const userApi = {
  create: async (userData: UserCreate): Promise<User> =>
    apiRequest<User>("/users/", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  list: (): Promise<User[]> => apiRequest<User[]>("/users/"),

  // ✅ Add sync function for Clerk integration
  syncClerkUser: async (clerkUser: any): Promise<User> => {
    const userData = {
      clerk_id: clerkUser.id,
      name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      email: clerkUser.primaryEmailAddress?.emailAddress,
    };
    
    return apiRequest<User>("/users/sync-clerk-user", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
};

export const expenseApi = {
  create: (userId: number, expenseData: ExpenseCreate): Promise<Expense> =>
    apiRequest<Expense>(`/expenses/?user_id=${encodeURIComponent(String(userId))}`, {
      method: "POST",
      body: JSON.stringify(expenseData),
    }),

  list: (userId: number): Promise<Expense[]> =>
    apiRequest<Expense[]>(`/expenses/?user_id=${encodeURIComponent(String(userId))}`),
};

export const analyticsApi = {
  getAnalytics: (userId: number, dateFrom?: string, dateTo?: string): Promise<AnalyticsData> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<AnalyticsData>(`/analytics/${encodeURIComponent(String(userId))}${query}`);
  },
};

export default {
  userApi,
  expenseApi,
  analyticsApi,
};