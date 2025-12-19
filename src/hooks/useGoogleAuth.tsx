import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export const useGoogleAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  // Fetch Google Client ID from edge function (only when authenticated)
  useEffect(() => {
    const fetchClientId = async () => {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('User not authenticated, skipping Google Client ID fetch');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-google-client-id');
        if (error) {
          console.error('Error fetching Google Client ID:', error);
          return;
        }
        if (data?.clientId) {
          console.log('Google Client ID loaded successfully');
          setGoogleClientId(data.clientId);
        }
      } catch (error) {
        console.error('Error fetching Google Client ID:', error);
      }
    };
    fetchClientId();

    // Re-fetch when auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchClientId();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    console.log('Google Client ID:', googleClientId ? 'Set (length: ' + googleClientId.length + ')' : 'NOT SET');
    
    if (!googleClientId) {
      toast.error('Google Client ID não configurado. Aguarde o carregamento.');
      console.error('Google Client ID is not loaded yet');
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
        client_id: googleClientId,
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
  }, [initGoogleAuth, googleClientId]);

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
