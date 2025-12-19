import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, Video, X, Phone, CheckCircle2, Bell, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";
import { StyledQRCode, defaultCustomization, defaultDeliveryIcons, QRCustomization } from "./StyledQRCode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const colorPresets = [
  { name: 'Clássico', bgColor: '#ffffff', fgColor: '#1a1a2e' },
  { name: 'Azul', bgColor: '#e0f2fe', fgColor: '#0c4a6e' },
  { name: 'Verde', bgColor: '#dcfce7', fgColor: '#14532d' },
  { name: 'Roxo', bgColor: '#f3e8ff', fgColor: '#581c87' },
  { name: 'Laranja', bgColor: '#ffedd5', fgColor: '#9a3412' },
  { name: 'Rosa', bgColor: '#fce7f3', fgColor: '#9d174d' },
];

const emojiOptions = ['🔔', '📦', '🏠', '🚪', '📱', '🔑', '⭐', '🎯'];

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
  const [showCustomize, setShowCustomize] = useState(false);
  const [customization, setCustomization] = useState<QRCustomization>({
    ...defaultCustomization,
    title: "ESCANEIE O QR CODE",
    subtitle: "PARA ENTRAR EM CONTATO",
  });

  // Always use our app URL, but include meet link as parameter if available
  const baseUrl = `${window.location.origin}/call/${encodeURIComponent(roomName)}?property=${encodeURIComponent(propertyName)}`;
  const callUrl = meetLink ? `${baseUrl}&meet=${encodeURIComponent(meetLink)}` : baseUrl;

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
      
      // Fixed proportional dimensions - wider for text
      const canvasWidth = 520;
      const qrSize = 220;
      const padding = 30;
      const headerHeight = 130;
      const warningHeight = 80;
      const deliveryHeight = defaultDeliveryIcons.length > 0 ? 110 : 0;
      const footerHeight = 40;
      
      canvas.width = canvasWidth;
      canvas.height = headerHeight + qrSize + 30 + warningHeight + deliveryHeight + footerHeight;
      
      img.onload = async () => {
        if (!ctx) return;
        
        // Background
        ctx.fillStyle = customization.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Logo emoji
        ctx.font = '40px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(customization.logoText, canvas.width / 2, 50);
        
        // Title
        ctx.fillStyle = customization.fgColor;
        ctx.font = 'bold 16px system-ui';
        ctx.fillText(customization.title, canvas.width / 2, 85);
        
        // Subtitle
        ctx.font = '14px system-ui';
        ctx.fillStyle = '#666';
        ctx.fillText(customization.subtitle, canvas.width / 2, 110);
        
        // QR Code centered
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = headerHeight;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        
        // Warning box
        const warningY = qrY + qrSize + 20;
        ctx.fillStyle = '#fef3c7';
        const boxWidth = canvas.width - padding * 2;
        ctx.fillRect(padding, warningY, boxWidth, warningHeight - 10);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, warningY, boxWidth, warningHeight - 10);
        
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 12px system-ui';
        ctx.fillText('Por favor, nao bata ou soe a campainha fisica.', canvas.width / 2, warningY + 20);
        ctx.fillText('Use a do Aplicativo.', canvas.width / 2, warningY + 38);
        ctx.fillStyle = '#b45309';
        ctx.font = '12px system-ui';
        ctx.fillText('Escaneie o QR Code Usando a Camera ou um App', canvas.width / 2, warningY + 56);
        
        // Delivery icons section
        if (defaultDeliveryIcons.length > 0) {
          const deliveryY = warningY + warningHeight + 5;
          
          ctx.fillStyle = '#eff6ff';
          ctx.fillRect(padding, deliveryY, boxWidth, 90);
          ctx.strokeStyle = '#bfdbfe';
          ctx.lineWidth = 2;
          ctx.strokeRect(padding, deliveryY, boxWidth, 90);
          
          ctx.fillStyle = '#1e40af';
          ctx.font = 'bold 13px system-ui';
          ctx.fillText('📦 Entregas:', canvas.width / 2, deliveryY + 22);
          
          const iconPromises = defaultDeliveryIcons.map((icon, index) => {
            return new Promise<void>((resolve) => {
              const iconImg = new Image();
              iconImg.crossOrigin = 'anonymous';
              iconImg.onload = () => {
                const iconWidth = 45;
                const iconHeight = 35;
                const gap = 15;
                const totalWidth = defaultDeliveryIcons.length * iconWidth + (defaultDeliveryIcons.length - 1) * gap;
                const startX = (canvas.width - totalWidth) / 2;
                const iconX = startX + index * (iconWidth + gap);
                
                // Icon background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(iconX - 4, deliveryY + 35, iconWidth + 8, iconHeight + 8);
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1;
                ctx.strokeRect(iconX - 4, deliveryY + 35, iconWidth + 8, iconHeight + 8);
                
                ctx.drawImage(iconImg, iconX, deliveryY + 39, iconWidth, iconHeight);
                resolve();
              };
              iconImg.onerror = () => resolve();
              iconImg.src = icon.url.startsWith('/') ? window.location.origin + icon.url : icon.url;
            });
          });
          
          await Promise.all(iconPromises);
        }
        
        // Permanent code text
        const codeY = canvas.height - 15;
        ctx.fillStyle = '#888';
        ctx.font = '11px system-ui';
        ctx.fillText('✓ Código permanente', canvas.width / 2, codeY);
        
        // Download
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
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass rounded-3xl p-4 sm:p-6 text-center max-w-md w-full relative my-4"
        style={{ boxShadow: "var(--shadow-card)" }}
        onClick={(e) => e.stopPropagation()}
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
            <Button variant="secondary" size="sm" onClick={() => setShowCustomize(true)}>
              <Settings2 className="w-4 h-4" />
              Personalizar
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

        {/* Customization Dialog */}
        <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Personalizar QR Code</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Text */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={customization.title}
                    onChange={(e) => setCustomization({ ...customization, title: e.target.value })}
                    placeholder="ESCANEIE O QR CODE"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    value={customization.subtitle}
                    onChange={(e) => setCustomization({ ...customization, subtitle: e.target.value })}
                    placeholder="PARA ENTRAR EM CONTATO"
                  />
                </div>
              </div>

              {/* Emoji */}
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setCustomization({ ...customization, logoText: emoji })}
                      className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                        customization.logoText === emoji
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <Label>Cores</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setCustomization({ 
                        ...customization, 
                        bgColor: preset.bgColor, 
                        fgColor: preset.fgColor 
                      })}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        customization.bgColor === preset.bgColor && customization.fgColor === preset.fgColor
                          ? 'border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: preset.bgColor }}
                    >
                      <span className="text-xs font-medium" style={{ color: preset.fgColor }}>
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={() => setShowCustomize(false)} className="w-full">
                Aplicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </motion.div>
  );
};
