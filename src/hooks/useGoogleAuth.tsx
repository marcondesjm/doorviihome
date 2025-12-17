import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export const useGoogleAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initGoogleAuth = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        console.log('Google OAuth already loaded');
        resolve();
        return;
      }

      console.log('Loading Google OAuth script...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google OAuth script loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google OAuth script:', error);
        reject(new Error('Failed to load Google OAuth script'));
      };
      document.head.appendChild(script);
    });
  }, []);

  const signIn = useCallback(async () => {
    console.log('Starting Google sign in...');
    console.log('Google Client ID:', GOOGLE_CLIENT_ID ? 'Set (length: ' + GOOGLE_CLIENT_ID.length + ')' : 'NOT SET');
    
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Client ID não configurado');
      console.error('VITE_GOOGLE_CLIENT_ID is not set');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await initGoogleAuth();
      
      console.log('Initializing token client...');
      
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google OAuth not available after script load');
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          console.log('OAuth callback received:', response.error ? 'Error' : 'Success');
          if (response.error) {
            console.error('OAuth error:', response.error, response.error_description);
            toast.error(`Erro OAuth: ${response.error_description || response.error}`);
            setIsLoading(false);
            return;
          }
          if (response.access_token) {
            console.log('Access token received');
            setAccessToken(response.access_token);
            setIsAuthenticated(true);
            localStorage.setItem('google_access_token', response.access_token);
            toast.success('Conectado ao Google com sucesso!');
          }
          setIsLoading(false);
        },
        error_callback: (error: any) => {
          console.error('Google OAuth error callback:', error);
          toast.error('Erro ao conectar com Google');
          setIsLoading(false);
        },
      });

      console.log('Requesting access token...');
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
      toast.error('Erro ao inicializar autenticação Google');
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
