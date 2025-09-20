// userSyncService.ts
import { User } from '@clerk/clerk-react';

const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI backend URL

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  clerk_id: string;
  allowance: number;
}

export async function syncUserWithBackend(clerkUser: User): Promise<BackendUser> {
  try {
    const userData = {
      clerk_id: clerkUser.id,
      name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      email: clerkUser.primaryEmailAddress?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName
    };

    const response = await fetch(`${API_BASE_URL}/users/sync-clerk-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync user: ${response.statusText}`);
    }

    const backendUser: BackendUser = await response.json();
    return backendUser;
  } catch (error) {
    console.error('Error syncing user with backend:', error);
    throw error;
  }
}

export async function getUserByClerkId(clerkId: string): Promise<BackendUser | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/clerk/${clerkId}`);
    
    if (response.status === 404) {
      return null; // User not found
    }
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user from backend:', error);
    return null;
  }
}