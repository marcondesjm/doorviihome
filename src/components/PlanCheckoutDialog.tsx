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
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // PIX data
  const pixKey = "48996029392";
  const pixName = "MARCONDES JORGE MACHADO";
  const whatsappNumber = "5548996029392";
  const city = "FLORIANOPOLIS";

  // Generate valid PIX EMV payload
  const generatePixPayload = () => {
    const formatField = (id: string, value: string) => {
      const len = value.length.toString().padStart(2, '0');
      return `${id}${len}${value}`;
    };

    // Merchant Account Information (ID 26)
    const gui = formatField("00", "br.gov.bcb.pix");
    const key = formatField("01", pixKey);
    const merchantAccount = formatField("26", gui + key);

    // Build payload without CRC
    const payloadWithoutCRC = [
      formatField("00", "01"), // Payload Format Indicator
      merchantAccount,
      formatField("52", "0000"), // Merchant Category Code
      formatField("53", "986"), // Transaction Currency (BRL)
      formatField("54", planPrice.toFixed(2)), // Transaction Amount
      formatField("58", "BR"), // Country Code
      formatField("59", pixName.substring(0, 25)), // Merchant Name
      formatField("60", city.substring(0, 15)), // Merchant City
      formatField("62", formatField("05", "***")), // Additional Data
    ].join('');

    // Calculate CRC16-CCITT
    const payloadForCRC = payloadWithoutCRC + "6304";
    let crc = 0xFFFF;
    for (let i = 0; i < payloadForCRC.length; i++) {
      crc ^= payloadForCRC.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
      }
      crc &= 0xFFFF;
    }

    return payloadForCRC + crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const pixPayload = generatePixPayload();

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(true);
    toast({
      title: "Chave PIX copiada!",
      description: "Cole no seu aplicativo de banco",
    });
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const copyPixPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    toast({
      title: "Código PIX copiado!",
      description: "Cole no seu aplicativo de banco (copia e cola)",
    });
    setTimeout(() => setCopiedPayload(false), 3000);
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
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code para pagar via PIX
            </p>
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCodeSVG
                value={pixPayload}
                size={180}
                level="M"
                includeMargin
              />
            </div>
            
            {/* PIX Key Copy - Below QR Code */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-3">
              {/* Copia e Cola */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Copia e Cola PIX:</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={pixPayload}
                    readOnly
                    className="text-center font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPixPayload}
                    className="shrink-0"
                  >
                    {copiedPayload ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Chave PIX */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Ou copie a chave PIX:</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={pixKey}
                    readOnly
                    className="text-center font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPixKey}
                    className="shrink-0"
                  >
                    {copiedKey ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pixName}
                </p>
              </div>
            </div>
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
