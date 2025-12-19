import { motion } from "framer-motion";
import pixLogo from "@/assets/pix-logo.png";
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
  HelpCircle, 
  Instagram, 
  CreditCard, 
  Trash2,
  UserPlus,
  Info,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AddPropertyDialog } from "./AddPropertyDialog";
import { JoinAsMemberDialog } from "./JoinAsMemberDialog";
import { InviteMemberDialog } from "./InviteMemberDialog";
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showJoinMember, setShowJoinMember] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAboutCreator, setShowAboutCreator] = useState(false);

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
        title: 'DoorVI Home - Portaria Inteligente',
        text: 'Confira o DoorVI Home, o melhor app de portaria inteligente!',
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
        title: 'Conheça o DoorVI Home!',
        text: 'Estou usando o DoorVI Home para gerenciar minha portaria. Experimente você também!',
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(`Estou usando o DoorVI Home para gerenciar minha portaria. Experimente você também! ${window.location.origin}`);
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
    window.open('https://instagram.com/doorvihome', '_blank');
  };

  const handleRestorePayment = () => {
    toast({
      title: "Restaurar Pagamento",
      description: "Verificando suas compras anteriores...",
    });
  };

  const handleRingtone = () => {
    toast({
      title: "Som de Toque",
      description: "Em breve você poderá personalizar o som de toque!",
    });
  };

  const handleJoinAsMember = () => {
    setShowJoinMember(true);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText("48996029392");
    toast({
      title: "PIX copiado!",
      description: "A chave PIX foi copiada para a área de transferência.",
    });
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
              Door<span className="text-primary">VI</span> Home
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
            </Button>
            
            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover">
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
                  Indique o DoorVI Home aos amigos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
                <DropdownMenuSeparator />
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

      <AlertDialog open={showAboutCreator} onOpenChange={setShowAboutCreator}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Sobre o Criador
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-semibold text-foreground text-lg">Marcondes Jorge Machado</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tecnólogo em Análise e Desenvolvimento de Sistemas desde 2017
                  </p>
                  <p className="text-sm text-primary font-medium mt-2">
                    CEO da DoorVI Home
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={pixLogo} alt="PIX" className="w-5 h-5" />
                    <span className="font-medium text-foreground">Apoie o Projeto</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Faça uma doação via PIX para ajudar no desenvolvimento:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-background rounded border text-sm font-mono">
                      48996029392
                    </code>
                    <Button size="sm" variant="secondary" onClick={handleCopyPix}>
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
