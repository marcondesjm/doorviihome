import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, MessageCircle, Check } from "lucide-react";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface WhatsAppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhatsAppConfigDialog = ({ open, onOpenChange }: WhatsAppConfigDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadPhone();
    }
  }, [open, user]);

  const loadPhone = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.phone) {
        setPhone(data.phone);
      }
    } catch (err) {
      console.error('Error loading phone:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Brazilian phone: (XX) XXXXX-XXXX
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSave = async () => {
    if (!user) return;
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      toast({
        title: "Número inválido",
        description: "Digite um número de telefone válido com DDD",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({ phone: `+55${digits}` })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({ 
            user_id: user.id, 
            phone: `+55${digits}` 
          });

        if (error) throw error;
      }

      toast({
        title: "WhatsApp salvo!",
        description: "Você receberá notificações neste número quando a campainha tocar.",
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving phone:', err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o número. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
            Configurar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Cadastre seu número para receber notificações no WhatsApp quando visitantes tocarem a campainha.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Número do WhatsApp</Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm">
                    <span>🇧🇷</span>
                    <span>+55</span>
                  </div>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={16}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite seu número com DDD
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Receba alertas quando a campainha tocar</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Funciona mesmo com o app fechado</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Integração direta com WhatsApp</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <WhatsAppIcon className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};