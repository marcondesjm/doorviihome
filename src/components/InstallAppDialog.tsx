import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Share, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallAppDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Show dialog only if:
    // 1. User is logged in
    // 2. Not already installed as PWA
    // 3. Not dismissed in this session
    // 4. Has install prompt available OR is iOS
    if (
      user && 
      !isStandalone && 
      !dismissed &&
      (deferredPrompt || isIOS)
    ) {
      const timer = setTimeout(() => {
        // Check if user has seen install prompt before
        const hasSeenInstallPrompt = localStorage.getItem('install_prompt_dismissed');
        // Also check if notification prompt is showing (wait for it to close)
        const hasSeenNotificationPrompt = localStorage.getItem('notification_prompt_dismissed');
        
        if (!hasSeenInstallPrompt) {
          // Wait a bit more if notification dialog might be showing
          const delay = hasSeenNotificationPrompt ? 0 : 3000;
          setTimeout(() => setOpen(true), delay);
        }
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [user, isStandalone, dismissed, deferredPrompt, isIOS]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setOpen(false);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setOpen(false);
  };

  const handleNeverAsk = () => {
    localStorage.setItem('install_prompt_dismissed', 'true');
    setDismissed(true);
    setOpen(false);
  };

  // Don't show if already installed
  if (isStandalone) return null;

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
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Smartphone className="w-8 h-8 text-primary" />
            </motion.div>
          </motion.div>
          <DialogTitle className="text-xl">Instalar DoorVii Home</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Instale o app no seu celular para acesso rápido e receber notificações!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <Download className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm">Acesso direto da tela inicial</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm">Funciona como um app nativo</span>
          </motion.div>
        </div>

        {isIOS ? (
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm font-medium mb-2">Como instalar no iPhone:</p>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                <span>Toque no botão <Share className="w-4 h-4 inline mx-1" /> Compartilhar</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                <span>Role e toque em "Adicionar à Tela de Início"</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                <span>Toque em "Adicionar"</span>
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          <div className="flex flex-col gap-2 mt-6">
            <Button onClick={handleInstall} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Instalar Agora
            </Button>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm font-medium mb-2">Como instalar no Android:</p>
            <ol className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                <span>Toque nos <MoreVertical className="w-4 h-4 inline mx-1" /> 3 pontos do navegador</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                <span>Toque em "Instalar app" ou "Adicionar à tela inicial"</span>
              </li>
            </ol>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
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
