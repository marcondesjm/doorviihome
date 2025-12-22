import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export function EnableNotificationsDialog() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading, subscribe, permission } = usePushNotifications();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show dialog only if:
    // 1. User is logged in
    // 2. Push notifications are supported
    // 3. Not already subscribed
    // 4. Not already dismissed in this session
    // 5. Permission not already denied
    if (
      user && 
      isSupported && 
      !isSubscribed && 
      !dismissed && 
      permission !== 'denied' &&
      !loading
    ) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        // Check if user has dismissed before (stored in localStorage)
        const hasSeenPrompt = localStorage.getItem('notification_prompt_dismissed');
        if (!hasSeenPrompt) {
          setOpen(true);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, isSubscribed, dismissed, permission, loading]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setOpen(false);
  };

  const handleNeverAsk = () => {
    localStorage.setItem('notification_prompt_dismissed', 'true');
    setDismissed(true);
    setOpen(false);
  };

  if (!isSupported) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
            >
              <BellRing className="w-8 h-8 text-primary" />
            </motion.div>
          </motion.div>
          <DialogTitle className="text-xl">Ativar Notificações</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Receba alertas instantâneos quando um visitante tocar a campainha, mesmo com o app em segundo plano!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <Bell className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm">Notificações em tempo real de visitantes</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <Bell className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm">Funciona mesmo com o celular bloqueado</span>
          </motion.div>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={handleEnable} disabled={loading} className="w-full">
            {loading ? 'Ativando...' : 'Ativar Notificações'}
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full">
            Agora não
          </Button>
          <button
            onClick={handleNeverAsk}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Não perguntar novamente
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
