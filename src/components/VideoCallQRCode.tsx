import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, Video, X, Phone, CheckCircle2, Bell, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import { StyledQRCode, defaultCustomization, defaultDeliveryIcons } from "./StyledQRCode";

interface VideoCallQRCodeProps {
  roomName: string;
  propertyName: string;
  onClose: () => void;
  onStartCall?: () => void;
  visitorJoined?: boolean;
  meetLink?: string | null;
  doorbellRinging?: boolean;
}

export const VideoCallQRCode = ({
  roomName,
  propertyName,
  onClose,
  onStartCall,
  visitorJoined = false,
  meetLink,
  doorbellRinging = false,
}: VideoCallQRCodeProps) => {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  // Always use our app URL, but include meet link as parameter if available
  const baseUrl = `${window.location.origin}/call/${encodeURIComponent(roomName)}?property=${encodeURIComponent(propertyName)}`;
  const callUrl = meetLink ? `${baseUrl}&meet=${encodeURIComponent(meetLink)}` : baseUrl;

  const customization = {
    ...defaultCustomization,
    title: "ESCANEIE O QR CODE",
    subtitle: "PARA ENTRAR EM CONTATO",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(callUrl);
    toast({
      title: "Link copiado!",
      description: "O link da chamada foi copiado para a área de transferência.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Chamada de vídeo - ${propertyName}`,
        text: `Entre na chamada de vídeo para ${propertyName}`,
        url: callUrl,
      });
    } else {
      handleCopy();
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const padding = 60;
      const qrSize = customization.size;
      const deliveryHeight = defaultDeliveryIcons.length > 0 ? 120 : 0;
      canvas.width = Math.max(qrSize + padding * 2, 400);
      canvas.height = qrSize + 280 + deliveryHeight;
      
      img.onload = async () => {
        if (!ctx) return;
        
        ctx.fillStyle = customization.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '48px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(customization.logoText, canvas.width / 2, 55);
        
        ctx.fillStyle = customization.fgColor;
        ctx.font = 'bold 18px system-ui';
        ctx.fillText(customization.title, canvas.width / 2, 95);
        
        ctx.font = '16px system-ui';
        ctx.fillStyle = '#666';
        ctx.fillText(customization.subtitle, canvas.width / 2, 120);
        
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 145;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        
        const warningY = qrY + qrSize + 20;
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(padding / 2, warningY, canvas.width - padding, 55);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding / 2, warningY, canvas.width - padding, 55);
        
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 12px system-ui';
        ctx.fillText('⚠️ Por favor, não bata ou soe a campainha física. Use a do Aplicativo.', canvas.width / 2, warningY + 22);
        ctx.fillStyle = '#b45309';
        ctx.font = '12px system-ui';
        ctx.fillText('📱 Escaneie o QR Code Usando a Câmera ou um App', canvas.width / 2, warningY + 42);
        
        if (defaultDeliveryIcons.length > 0) {
          const deliveryY = warningY + 75;
          
          ctx.fillStyle = '#eff6ff';
          ctx.fillRect(padding / 2, deliveryY, canvas.width - padding, 90);
          ctx.strokeStyle = '#bfdbfe';
          ctx.lineWidth = 2;
          ctx.strokeRect(padding / 2, deliveryY, canvas.width - padding, 90);
          
          ctx.fillStyle = '#1e40af';
          ctx.font = 'bold 14px system-ui';
          ctx.fillText('📦 Entregas:', canvas.width / 2, deliveryY + 25);
          
          const iconPromises = defaultDeliveryIcons.map((icon, index) => {
            return new Promise<void>((resolve) => {
              const iconImg = new Image();
              iconImg.crossOrigin = 'anonymous';
              iconImg.onload = () => {
                const iconWidth = 50;
                const iconHeight = 40;
                const totalWidth = defaultDeliveryIcons.length * (iconWidth + 20) - 20;
                const startX = (canvas.width - totalWidth) / 2;
                const iconX = startX + index * (iconWidth + 20);
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(iconX - 5, deliveryY + 40, iconWidth + 10, iconHeight + 10);
                ctx.strokeStyle = '#e2e8f0';
                ctx.strokeRect(iconX - 5, deliveryY + 40, iconWidth + 10, iconHeight + 10);
                
                ctx.drawImage(iconImg, iconX, deliveryY + 45, iconWidth, iconHeight);
                resolve();
              };
              iconImg.onerror = () => resolve();
              iconImg.src = icon.url.startsWith('/') ? window.location.origin + icon.url : icon.url;
            });
          });
          
          await Promise.all(iconPromises);
        }
        
        const codeY = defaultDeliveryIcons.length > 0 ? warningY + 180 : warningY + 75;
        ctx.fillStyle = '#888';
        ctx.font = '12px system-ui';
        ctx.fillText('✓ Código permanente', canvas.width / 2, codeY);
        
        const link = document.createElement('a');
        link.download = `qrcode-${propertyName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        toast({
          title: "QR Code baixado!",
          description: "A imagem foi salva no seu dispositivo.",
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error('Erro ao baixar:', e);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o QR Code.",
        variant: "destructive",
      });
    }
  };

  const handleStartCall = () => {
    if (onStartCall) {
      onStartCall();
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass rounded-3xl p-4 sm:p-6 text-center max-w-md w-full relative my-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Chamada de Vídeo</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Escaneie o QR Code no celular do visitante
        </p>

        {/* Styled QR Code Component */}
        <div ref={qrRef}>
          <StyledQRCode
            url={callUrl}
            customization={customization}
            deliveryIcons={defaultDeliveryIcons}
            showDeliveryIcons={true}
            showWarning={true}
            showPermanentCode={true}
            compact={true}
          />
        </div>

        {/* Property name */}
        <div className="my-3">
          <p className="text-xs text-muted-foreground mb-1">Propriedade</p>
          <p className="font-medium text-primary">{propertyName}</p>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full ${visitorJoined ? 'bg-success/20' : 'bg-warning/20'}`}>
          {visitorJoined ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">Visitante conectado!</span>
            </>
          ) : (
            <>
              <motion.span 
                className="w-2 h-2 rounded-full bg-warning"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="text-sm text-warning">Aguardando visitante...</span>
            </>
          )}
        </div>

        {/* Alerta de campainha tocando */}
        <AnimatePresence>
          {doorbellRinging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="bg-amber-500 text-amber-950 rounded-xl p-4 mb-4 flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <Bell className="w-6 h-6" />
              </motion.div>
              <div className="flex-1 text-left">
                <p className="font-bold">🔔 Campainha tocando!</p>
                <p className="text-sm opacity-90">Visitante aguardando na porta</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Baixar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              Copiar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>
          
          <Button 
            variant={visitorJoined ? "call" : "secondary"} 
            className="w-full" 
            onClick={handleStartCall}
          >
            <Phone className="w-4 h-4" />
            {visitorJoined ? "Entrar agora - Visitante aguardando!" : "Entrar na chamada"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Clique em "Entrar na chamada" para iniciar a videochamada do seu lado
        </p>
      </motion.div>
    </motion.div>
  );
};
