import { useState, useCallback } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export const useGoogleAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initGoogleAuth = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await initGoogleAuth();

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsAuthenticated(true);
            localStorage.setItem('google_access_token', response.access_token);
          }
          setIsLoading(false);
        },
        error_callback: (error: any) => {
          console.error('Google OAuth error:', error);
          setIsLoading(false);
        },
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
      setIsLoading(false);
    }
  }, [initGoogleAuth]);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('google_access_token');
    
    if (window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(accessToken || '', () => {
        console.log('Google token revoked');
      });
    }
  }, [accessToken]);

  // Check for existing token on mount
  const checkExistingToken = useCallback(() => {
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  return {
    accessToken,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    checkExistingToken,
  };
};

// Type declaration for Google OAuth
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => { requestAccessToken: () => void };
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}
