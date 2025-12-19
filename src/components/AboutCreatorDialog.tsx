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
import { Info, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import pixLogo from "@/assets/pix-logo.png";

interface AboutCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutCreatorDialog = ({ open, onOpenChange }: AboutCreatorDialogProps) => {
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
                  CEO da DoorVii Home
                </p>
                <a 
                  href="https://www.instagram.com/doorviiHome" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  @doorviiHome
                </a>
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
  );
};
