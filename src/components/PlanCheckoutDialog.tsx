import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PlanCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planPrice: number;
}

const PlanCheckoutDialog = ({
  open,
  onOpenChange,
  planName,
  planPrice,
}: PlanCheckoutDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  // PIX data
  const pixKey = "48996029392";
  const pixName = "Marcondes Jorge Machado";
  const whatsappNumber = "5548996029392";

  // Generate PIX payload (simplified EMV format)
  const generatePixPayload = () => {
    const merchantName = pixName.substring(0, 25).toUpperCase();
    const amount = planPrice.toFixed(2);
    const txId = `DOORVII${Date.now().toString().slice(-8)}`;
    
    // Simplified PIX Copy-Paste format
    const pixPayload = [
      "00020126",
      `3604${pixKey.length.toString().padStart(2, '0')}${pixKey}`,
      "52040000",
      "5303986",
      `54${amount.length.toString().padStart(2, '0')}${amount}`,
      "5802BR",
      `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`,
      "6008BRASILIA",
      `62${(txId.length + 4).toString().padStart(2, '0')}05${txId.length.toString().padStart(2, '0')}${txId}`,
      "6304"
    ].join('');

    // Calculate CRC16 (simplified - using placeholder)
    return pixPayload + "0000";
  };

  // Generate a simpler PIX string for QR Code
  const generateSimplePixString = () => {
    return `00020126580014br.gov.bcb.pix0136${pixKey}5204000053039865802BR5925${pixName.toUpperCase().substring(0, 25)}6008BRASILIA62070503***6304`;
  };

  const pixCopyPaste = `PIX: ${pixKey}\nValor: R$ ${planPrice.toFixed(2)}\nNome: ${pixName}\nPlano: ${planName}`;

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    toast({
      title: "Chave PIX copiada!",
      description: "Cole no seu aplicativo de banco",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendWhatsApp = () => {
    if (!fullName.trim() || !whatsapp.trim() || !email.trim()) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome completo, WhatsApp e Email são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const message = `🔔 *NOVO CADASTRO - DOORVII HOME*

📋 *Plano Escolhido:* ${planName}
💰 *Valor:* R$ ${planPrice.toFixed(2)}/mês

👤 *Dados do Cliente:*
• Nome: ${fullName}
• WhatsApp: ${whatsapp}
• Email: ${email}

✅ Aguardando confirmação do pagamento PIX.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
    
    toast({
      title: "Redirecionando para WhatsApp",
      description: "Complete seu cadastro enviando a mensagem",
    });
  };

  const getPlanColor = () => {
    switch (planName) {
      case "Essencial":
        return "text-green-500";
      case "Plus":
        return "text-primary";
      case "Pro":
        return "text-purple-500";
      default:
        return "text-primary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className={getPlanColor()}>Plano {planName}</span>
            <span className="block text-2xl font-bold mt-2">
              R$ {planPrice.toFixed(2)}/mês
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code PIX */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Escaneie o QR Code para pagar via PIX
            </p>
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCodeSVG
                value={pixCopyPaste}
                size={180}
                level="M"
                includeMargin
              />
            </div>
          </div>

          {/* PIX Key Copy */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-center">Chave PIX (Celular)</p>
            <div className="flex items-center gap-2">
              <Input
                value={pixKey}
                readOnly
                className="text-center font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyPixKey}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {pixName}
            </p>
          </div>

          {/* Registration Form */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-center text-foreground">
              Preencha seus dados para cadastro
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                placeholder="Digite seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Send to WhatsApp Button */}
          <Button
            onClick={handleSendWhatsApp}
            className="w-full gap-2"
            size="lg"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar Dados via WhatsApp
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Após o pagamento, envie seus dados para ativação do plano
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanCheckoutDialog;
