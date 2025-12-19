import { useState } from "react";
import { UserPlus, Copy, Check, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInviteCode, useInviteCodes } from "@/hooks/usePropertyMembers";
import { useProperties } from "@/hooks/useProperties";
import { useToast } from "@/hooks/use-toast";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
}

export function InviteMemberDialog({ open, onOpenChange, propertyId: initialPropertyId }: InviteMemberDialogProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId || "");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { data: properties = [] } = useProperties();
  const createInviteCode = useCreateInviteCode();
  const { toast } = useToast();

  const handleGenerateCode = async () => {
    if (!selectedPropertyId) {
      toast({
        title: "Erro",
        description: "Selecione uma propriedade",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createInviteCode.mutateAsync({
        propertyId: selectedPropertyId,
        expiresInHours: 24,
        maxUses: 1,
      });
      setGeneratedCode(result.code);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o código",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Compartilhe com quem você deseja convidar",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setGeneratedCode(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Convidar Membro</DialogTitle>
              <DialogDescription>
                Gere um código para convidar alguém
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Propriedade</Label>
            <Select 
              value={selectedPropertyId} 
              onValueChange={setSelectedPropertyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma propriedade" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {generatedCode ? (
            <div className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-2">Código de convite</p>
                <p className="text-4xl font-mono font-bold tracking-widest text-primary">
                  {generatedCode}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Válido por 24 horas • 1 uso
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCopy}
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar código
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleGenerateCode}
                  disabled={createInviteCode.isPending}
                >
                  <RefreshCw className={`w-4 h-4 ${createInviteCode.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Compartilhe este código com a pessoa que você deseja convidar.
                Ela poderá usar em "Configurações → Juntar-se como Membro".
              </p>
            </div>
          ) : (
            <Button 
              onClick={handleGenerateCode}
              disabled={!selectedPropertyId || createInviteCode.isPending}
              className="w-full"
            >
              {createInviteCode.isPending ? "Gerando..." : "Gerar Código de Convite"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
