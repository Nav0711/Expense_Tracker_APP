import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { userApi } from '@/lib/api';

export const useClerkUser = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [backendUser, setBackendUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const syncedUser = await userApi.syncClerkUser(user);
        setBackendUser(syncedUser);
        // Store the backend user ID
        localStorage.setItem("user_id", String(syncedUser.id));
      } catch (err) {
        console.error('Error syncing user:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user]);

  return { backendUser, isLoading, error };
};