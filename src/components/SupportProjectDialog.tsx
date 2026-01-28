import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import pixLogo from "@/assets/pix-logo.png";

interface SupportProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportProjectDialog = ({ open, onOpenChange }: SupportProjectDialogProps) => {
  const { toast } = useToast();

  const handleCopyPix = () => {
    navigator.clipboard.writeText("48996029392");
    toast({
      title: "PIX copiado!",
      description: "A chave PIX foi copiada para a área de transferência.",
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Apoie o Projeto
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p className="text-muted-foreground">
                Ajude-nos a continuar desenvolvendo o DoorVII com sua contribuição.
              </p>
              
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <img src={pixLogo} alt="PIX" className="w-5 h-5" />
                  <span className="font-medium text-foreground">Doação via PIX</span>
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

              <p className="text-xs text-muted-foreground text-center">
                Qualquer valor é bem-vindo e nos ajuda a melhorar o app!
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Fechar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
