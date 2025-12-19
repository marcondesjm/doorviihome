import { useState } from "react";
import { Users, Key, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJoinWithCode } from "@/hooks/usePropertyMembers";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface JoinAsMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinAsMemberDialog({ open, onOpenChange }: JoinAsMemberDialogProps) {
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState(false);
  const [propertyName, setPropertyName] = useState("");
  const joinWithCode = useJoinWithCode();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        title: "Erro",
        description: "Digite o código de convite",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await joinWithCode.mutateAsync(code.trim());
      setPropertyName(result.propertyName || "");
      setSuccess(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível usar o código",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setCode("");
    setSuccess(false);
    setPropertyName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-md">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center py-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Você entrou!</h3>
              <p className="text-muted-foreground mb-6">
                Agora você é membro de <span className="font-medium text-foreground">{propertyName}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Você pode atender chamadas de vídeo e ver atividades desta propriedade.
              </p>
              <Button onClick={handleClose} className="w-full">
                Continuar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>Juntar-se como Membro</DialogTitle>
                    <DialogDescription>
                      Digite o código de convite recebido
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="invite-code" className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Código de Convite
                  </Label>
                  <Input
                    id="invite-code"
                    placeholder="Ex: ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="text-center text-2xl tracking-widest font-mono uppercase"
                    maxLength={6}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    O código tem 6 caracteres e foi enviado pelo proprietário
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={joinWithCode.isPending || code.length < 6}
                    className="flex-1"
                  >
                    {joinWithCode.isPending ? "Verificando..." : "Entrar"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
