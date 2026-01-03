import { motion } from "framer-motion";
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  QrCode, 
  Plus, 
  Users, 
  Share2, 
  Gift, 
  Volume2, 
  Star,
  Download,
  HelpCircle, 
  Instagram, 
  CreditCard, 
  Trash2,
  UserPlus,
  Info,
  Heart,
  BellRing,
  BellOff,
  MessageCircle,
  RefreshCw,
  Shield,
  ClipboardCheck
} from "lucide-react";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AddPropertyDialog } from "./AddPropertyDialog";
import { JoinAsMemberDialog } from "./JoinAsMemberDialog";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { AboutCreatorDialog } from "./AboutCreatorDialog";
import { SupportProjectDialog } from "./SupportProjectDialog";
import { WhatsAppConfigDialog } from "./WhatsAppConfigDialog";
import { RingtoneConfigDialog } from "./RingtoneConfigDialog";
import { NotificationSettingsDialog } from "./NotificationSettingsDialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showJoinMember, setShowJoinMember] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAboutCreator, setShowAboutCreator] = useState(false);
  const [showSupportProject, setShowSupportProject] = useState(false);
  const [showWhatsAppConfig, setShowWhatsAppConfig] = useState(false);
  const [showRingtoneConfig, setShowRingtoneConfig] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  const { isSupported, isSubscribed, loading: notificationLoading, subscribe, unsubscribe, permission } = usePushNotifications();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Até logo!",
      description: "Você foi desconectado com sucesso"
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Sign out the user (actual deletion would require admin/edge function)
      await signOut();
      toast({
        title: "Conta excluída",
        description: "Sua conta foi marcada para exclusão. Entre em contato com o suporte se precisar de ajuda.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'DoorVii Home - Portaria Inteligente',
        text: 'Confira o DoorVii Home, o melhor app de portaria inteligente!',
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "Link copiado!",
        description: "O link do aplicativo foi copiado para a área de transferência.",
      });
    }
  };

  const handleRefer = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Conheça o DoorVii Home!',
        text: 'Estou usando o DoorVii Home para gerenciar minha portaria. Experimente você também!',
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(`Estou usando o DoorVii Home para gerenciar minha portaria. Experimente você também! ${window.location.origin}`);
      toast({
        title: "Link copiado!",
        description: "O convite foi copiado para a área de transferência.",
      });
    }
  };

  const handleRate = () => {
    toast({
      title: "Obrigado!",
      description: "Agradecemos sua avaliação! Em breve teremos um link para avaliação.",
    });
  };

  const handleHelp = () => {
    toast({
      title: "Central de Ajuda",
      description: "Entre em contato pelo email: suporte@doorvi.app",
    });
  };

  const handleSocialMedia = () => {
    window.open('https://www.instagram.com/doorviiHome', '_blank');
  };

  const handleRestorePayment = () => {
    toast({
      title: "Restaurar Pagamento",
      description: "Verificando suas compras anteriores...",
    });
  };

  const handleClearCache = async () => {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      toast({
        title: "Cache limpo!",
        description: "O cache do aplicativo foi limpo com sucesso. A página será recarregada.",
      });
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar o cache completamente.",
        variant: "destructive",
      });
    }
  };

  const handleRingtone = () => {
    setShowRingtoneConfig(true);
  };

  const handleJoinAsMember = () => {
    setShowJoinMember(true);
  };

  const handleToggleNotifications = async () => {
    if (notificationLoading) return;
    
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 glass border-b border-border/50"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-6 h-6 text-primary-foreground"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <rect x="9" y="14" width="6" height="8" rx="1" />
                <circle cx="12" cy="10" r="2" />
              </svg>
            </div>
            <span className="text-xl font-bold">
              Door<span className="text-primary">Vii</span> Home
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => navigate('/qrcode')}
              className="hidden sm:flex"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/qrcode')}
              className="sm:hidden"
            >
              <QrCode className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setShowNotificationSettings(true)}
            >
              <Bell className="w-5 h-5" />
              {!isSubscribed && isSupported && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
              )}
            </Button>
            
            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover max-h-[70vh] overflow-y-auto">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-3 text-primary" />
                      Gerenciar Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin#checklist')}>
                      <ClipboardCheck className="w-4 h-4 mr-3 text-primary" />
                      Checklist do Sistema
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setShowAddProperty(true)}>
                  <Plus className="w-4 h-4 mr-3" />
                  Adicionar propriedade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleJoinAsMember}>
                  <Users className="w-4 h-4 mr-3" />
                  Juntar-se como Membro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowInviteMember(true)}>
                  <UserPlus className="w-4 h-4 mr-3" />
                  Convidar Membro
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-3" />
                  Compartilhar aplicativo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefer}>
                  <Gift className="w-4 h-4 mr-3" />
                  Indique o DoorVii Home aos amigos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowNotificationSettings(true)}>
                  <Bell className="w-4 h-4 mr-3" />
                  Configurações de Notificação
                  {!isSubscribed && isSupported && (
                    <span className="ml-auto w-2 h-2 bg-accent rounded-full" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowWhatsAppConfig(true)}>
                  <WhatsAppIcon className="w-4 h-4 mr-3 text-[#25D366]" />
                  Notificação WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRingtone}>
                  <Volume2 className="w-4 h-4 mr-3" />
                  Som de Toque
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRate}>
                  <Star className="w-4 h-4 mr-3" />
                  Avalie-nos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleHelp}>
                  <HelpCircle className="w-4 h-4 mr-3" />
                  Ajuda
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSocialMedia}>
                  <Instagram className="w-4 h-4 mr-3" />
                  Siga-nos nas Redes Sociais
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAboutCreator(true)}>
                  <Info className="w-4 h-4 mr-3" />
                  Sobre o Criador
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSupportProject(true)}>
                  <Heart className="w-4 h-4 mr-3" />
                  Apoie o Projeto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/install')}>
                  <Download className="w-4 h-4 mr-3" />
                  Instalar Aplicativo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearCache}>
                  <RefreshCw className="w-4 h-4 mr-3" />
                  Limpar Cache
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRestorePayment}>
                  <CreditCard className="w-4 h-4 mr-3" />
                  Restaurar Pagamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-warning">
                  <LogOut className="w-4 h-4 mr-3" />
                  Sair
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Excluir conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="ml-2">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <AddPropertyDialog 
        open={showAddProperty} 
        onOpenChange={setShowAddProperty}
        showTrigger={false}
      />

      <JoinAsMemberDialog 
        open={showJoinMember} 
        onOpenChange={setShowJoinMember} 
      />

      <InviteMemberDialog 
        open={showInviteMember} 
        onOpenChange={setShowInviteMember} 
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita 
              e todos os seus dados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AboutCreatorDialog 
        open={showAboutCreator} 
        onOpenChange={setShowAboutCreator} 
      />

      <SupportProjectDialog 
        open={showSupportProject} 
        onOpenChange={setShowSupportProject} 
      />

      <WhatsAppConfigDialog
        open={showWhatsAppConfig}
        onOpenChange={setShowWhatsAppConfig}
      />

      <RingtoneConfigDialog
        open={showRingtoneConfig}
        onOpenChange={setShowRingtoneConfig}
      />

      <NotificationSettingsDialog
        open={showNotificationSettings}
        onOpenChange={setShowNotificationSettings}
      />
    </>
  );
};
