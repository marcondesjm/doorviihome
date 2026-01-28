import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, BellRing, Settings, Smartphone, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface NotificationSettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function NotificationSettingsDialog({ 
  open, 
  onOpenChange,
  trigger 
}: NotificationSettingsDialogProps) {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    loading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();
  
  const [testingSent, setTestingSent] = useState(false);

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const success = await subscribe();
      if (success) {
        // Send a test notification
        setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Notificações ativadas!', {
              body: 'Você receberá alertas quando alguém tocar a campainha.',
              icon: '/pwa-192x192.png',
              tag: 'test-notification'
            });
          }
        }, 1000);
      }
    }
  };

  const handleTestNotification = async () => {
    if (!isSubscribed) {
      toast.error('Ative as notificações primeiro');
      return;
    }

    try {
      // Create a local notification for testing
      if ('Notification' in window && Notification.permission === 'granted') {
        const notificationOptions: NotificationOptions = {
          body: 'Se você está vendo isso, as notificações estão funcionando!',
          icon: '/pwa-192x192.png',
          tag: 'test-notification-' + Date.now(),
          requireInteraction: true,
        };
        new Notification('🔔 Teste de Notificação', notificationOptions);
        setTestingSent(true);
        toast.success('Notificação de teste enviada!');
        setTimeout(() => setTestingSent(false), 3000);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Erro ao enviar notificação de teste');
    }
  };

  const getStatusInfo = () => {
    if (!isSupported) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-destructive" />,
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push.',
        color: 'text-destructive'
      };
    }

    if (permission === 'denied') {
      return {
        icon: <BellOff className="w-5 h-5 text-destructive" />,
        title: 'Bloqueado',
        description: 'Notificações foram bloqueadas. Você precisa alterar nas configurações do navegador/app.',
        color: 'text-destructive'
      };
    }

    if (isSubscribed) {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        title: 'Ativado',
        description: 'Você receberá notificações quando visitantes tocarem a campainha.',
        color: 'text-green-500'
      };
    }

    return {
      icon: <Bell className="w-5 h-5 text-muted-foreground" />,
      title: 'Desativado',
      description: 'Ative para receber alertas de visitantes.',
      color: 'text-muted-foreground'
    };
  };

  const status = getStatusInfo();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Bell className="w-7 h-7 text-primary" />
          </motion.div>
          <DialogTitle className="text-center">Configurações de Notificação</DialogTitle>
          <DialogDescription className="text-center">
            Gerencie como você recebe alertas de visitantes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-muted/50 border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {status.icon}
                <div>
                  <p className={`font-medium ${status.color}`}>{status.title}</p>
                  <p className="text-sm text-muted-foreground">{status.description}</p>
                </div>
              </div>
              
              {isSupported && permission !== 'denied' && (
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handleToggle}
                  disabled={loading}
                />
              )}
            </div>
          </motion.div>

          {/* Test Notification Button */}
          {isSubscribed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleTestNotification}
                disabled={testingSent}
              >
                <BellRing className="w-4 h-4 mr-2" />
                {testingSent ? 'Notificação enviada!' : 'Enviar notificação de teste'}
              </Button>
            </motion.div>
          )}

          {/* PWA Instructions for iOS */}
          {isIOS && !isStandalone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
            >
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-400">
                    Instale o app para notificações
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No iPhone, as notificações só funcionam quando o app está instalado na tela inicial.
                  </p>
                  <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                    <li>Toque no ícone de compartilhar <span className="font-mono">(⬆️)</span></li>
                    <li>Selecione "Adicionar à Tela Inicial"</li>
                    <li>Abra o app instalado</li>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}

          {/* Instructions when permission is denied */}
          {permission === 'denied' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
            >
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">
                    Como desbloquear notificações
                  </p>
                  {isAndroid ? (
                    <div className="text-sm text-muted-foreground mt-2 space-y-2">
                      <p>No Android:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Abra Configurações do celular</li>
                        <li>Vá em Apps → {isStandalone ? 'DoorVII' : 'Navegador'}</li>
                        <li>Toque em Notificações</li>
                        <li>Ative "Permitir notificações"</li>
                      </ol>
                    </div>
                  ) : isIOS ? (
                    <div className="text-sm text-muted-foreground mt-2 space-y-2">
                      <p>No iPhone:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Abra Ajustes do iPhone</li>
                        <li>Role até {isStandalone ? 'DoorVII' : 'Safari'}</li>
                        <li>Toque em Notificações</li>
                        <li>Ative "Permitir Notificações"</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-2 space-y-2">
                      <p>No navegador:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Clique no ícone de cadeado na barra de endereço</li>
                        <li>Encontre "Notificações"</li>
                        <li>Altere para "Permitir"</li>
                        <li>Recarregue a página</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Benefits when not subscribed */}
          {!isSubscribed && permission !== 'denied' && isSupported && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Benefícios das notificações:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <BellRing className="w-4 h-4 text-primary" />
                  <span className="text-sm">Alertas em tempo real de visitantes</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span className="text-sm">Funciona com celular bloqueado</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
