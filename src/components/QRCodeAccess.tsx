import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { 
  Copy, 
  Share2, 
  RefreshCw, 
  Download, 
  Printer, 
  Palette,
  Camera,
  X,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QRCodeAccessProps {
  accessCode: string;
  expiresIn?: string;
  propertyName: string;
  onRefresh?: () => void;
}

interface QRCustomization {
  title: string;
  subtitle: string;
  fgColor: string;
  bgColor: string;
  logoText: string;
}

const colorPresets = [
  { name: "Padrão", fg: "#1a1a2e", bg: "#f8fafc" },
  { name: "Azul", fg: "#1e40af", bg: "#dbeafe" },
  { name: "Verde", fg: "#166534", bg: "#dcfce7" },
  { name: "Roxo", fg: "#6b21a8", bg: "#f3e8ff" },
  { name: "Laranja", fg: "#c2410c", bg: "#ffedd5" },
  { name: "Vermelho", fg: "#b91c1c", bg: "#fee2e2" },
];

export const QRCodeAccess = ({
  accessCode,
  expiresIn = "24 horas",
  propertyName,
  onRefresh,
}: QRCodeAccessProps) => {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showCameraHint, setShowCameraHint] = useState(false);
  
  const [customization, setCustomization] = useState<QRCustomization>({
    title: "Acesse pelo QR Code",
    subtitle: propertyName,
    fgColor: "#1a1a2e",
    bgColor: "#f8fafc",
    logoText: "🏠",
  });

  // Generate the visitor URL
  const visitorUrl = `${window.location.origin}/call/${encodeURIComponent(accessCode)}?property=${encodeURIComponent(propertyName)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(visitorUrl);
    toast({
      title: "Link copiado!",
      description: "O link de acesso foi copiado para a área de transferência.",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Acesso para ${propertyName}`,
          text: `Escaneie o QR Code ou acesse o link para entrar em contato: ${visitorUrl}`,
          url: visitorUrl,
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) return;

    try {
      // Create a canvas from the QR code
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Create a larger canvas for better quality
      canvas.width = 400;
      canvas.height = 500;
      
      img.onload = () => {
        if (!ctx) return;
        
        // Fill background
        ctx.fillStyle = customization.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw title
        ctx.fillStyle = customization.fgColor;
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(customization.title, canvas.width / 2, 40);
        
        // Draw subtitle
        ctx.font = '18px system-ui';
        ctx.fillText(customization.subtitle, canvas.width / 2, 70);
        
        // Draw QR code
        ctx.drawImage(img, 50, 100, 300, 300);
        
        // Draw instruction
        ctx.font = '14px system-ui';
        ctx.fillStyle = '#666';
        ctx.fillText('📱 Escaneie com a câmera do celular', canvas.width / 2, 430);
        
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Popup bloqueado",
        description: "Permita popups para imprimir o QR Code.",
        variant: "destructive",
      });
      return;
    }

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${propertyName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 40px;
            background: ${customization.bgColor};
            color: ${customization.fgColor};
          }
          .container {
            text-align: center;
            max-width: 400px;
            padding: 40px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .logo { font-size: 48px; margin-bottom: 16px; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          .subtitle { font-size: 18px; color: #666; margin-bottom: 24px; }
          .qr-container { 
            background: ${customization.bgColor}; 
            padding: 20px; 
            border-radius: 16px; 
            display: inline-block;
            margin-bottom: 24px;
          }
          .instruction { 
            font-size: 14px; 
            color: #888; 
            margin-top: 16px;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          .camera-icon { font-size: 24px; margin-bottom: 8px; }
          .expires { font-size: 12px; color: #999; margin-top: 12px; }
          @media print {
            body { padding: 20px; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">${customization.logoText}</div>
          <h1>${customization.title}</h1>
          <p class="subtitle">${customization.subtitle}</p>
          <div class="qr-container">
            ${svgData}
          </div>
          <div class="instruction">
            <div class="camera-icon">📱</div>
            <p>Abra a câmera do celular e aponte para o QR Code</p>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenCamera = () => {
    setShowCameraHint(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-6 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="font-semibold text-lg mb-1">Acesso para Visitantes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Compartilhe este QR Code com seus visitantes
        </p>

        {/* Camera Hint */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 rounded-xl p-3 mb-4 flex items-center gap-2 justify-center"
        >
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            Aponte a câmera do celular para escanear
          </span>
        </motion.div>

        {/* QR Code Container */}
        <div className="relative inline-block" ref={qrRef}>
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative p-4 rounded-2xl inline-block"
            style={{ backgroundColor: customization.bgColor }}
          >
            <QRCodeSVG
              value={visitorUrl}
              size={180}
              bgColor={customization.bgColor}
              fgColor={customization.fgColor}
              level="H"
              includeMargin={false}
            />
          </motion.div>
        </div>

        {/* Property info */}
        <div className="mt-4 mb-2">
          <p className="text-xs text-muted-foreground mb-1">Propriedade</p>
          <p className="font-medium text-primary">{propertyName}</p>
        </div>


        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant="default" size="sm" onClick={handleDownload} className="w-full">
            <Download className="w-4 h-4" />
            Baixar
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint} className="w-full">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
          <Button variant="secondary" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowCustomize(true)}>
            <Palette className="w-4 h-4" />
            Personalizar
          </Button>
          {onRefresh && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Camera tip */}
        <div className="mt-4 pt-4 border-t border-border">
          <button 
            onClick={handleOpenCamera}
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-1 w-full"
          >
            <Camera className="w-3 h-3" />
            Dica: O visitante só precisa apontar a câmera para escanear
          </button>
        </div>
      </motion.div>

      {/* Customization Dialog */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Personalizar QR Code
            </DialogTitle>
            <DialogDescription>
              Customize o visual do seu QR Code para impressão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={customization.title}
                onChange={(e) => setCustomization({ ...customization, title: e.target.value })}
                placeholder="Acesse pelo QR Code"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={customization.subtitle}
                onChange={(e) => setCustomization({ ...customization, subtitle: e.target.value })}
                placeholder={propertyName}
              />
            </div>

            {/* Logo Emoji */}
            <div className="space-y-2">
              <Label htmlFor="logo">Ícone/Emoji</Label>
              <Input
                id="logo"
                value={customization.logoText}
                onChange={(e) => setCustomization({ ...customization, logoText: e.target.value })}
                placeholder="🏠"
                maxLength={4}
              />
            </div>

            {/* Color Presets */}
            <div className="space-y-2">
              <Label>Esquema de cores</Label>
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setCustomization({ 
                      ...customization, 
                      fgColor: preset.fg, 
                      bgColor: preset.bg 
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      customization.fgColor === preset.fg 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ backgroundColor: preset.bg }}
                  >
                    <div 
                      className="w-6 h-6 rounded mx-auto mb-1"
                      style={{ backgroundColor: preset.fg }}
                    />
                    <span className="text-xs" style={{ color: preset.fg }}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Pré-visualização</Label>
              <div 
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: customization.bgColor }}
              >
                <div className="text-2xl mb-1">{customization.logoText}</div>
                <p className="font-semibold text-sm" style={{ color: customization.fgColor }}>
                  {customization.title}
                </p>
                <p className="text-xs opacity-70" style={{ color: customization.fgColor }}>
                  {customization.subtitle}
                </p>
                <div className="mt-2 inline-block p-2 bg-white rounded-lg">
                  <QRCodeSVG
                    value={visitorUrl}
                    size={80}
                    bgColor={customization.bgColor}
                    fgColor={customization.fgColor}
                    level="H"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCustomize(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={() => {
                setShowCustomize(false);
                toast({
                  title: "Personalização salva!",
                  description: "Agora você pode baixar ou imprimir com o novo visual.",
                });
              }}>
                <Check className="w-4 h-4" />
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Hint Modal */}
      <Dialog open={showCameraHint} onOpenChange={setShowCameraHint}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Como escanear o QR Code
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="text-4xl text-center mb-4">📱</div>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                  <span>Abra o app de <strong>Câmera</strong> do celular</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                  <span>Aponte a câmera para o <strong>QR Code</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                  <span>Toque no link que aparecer na tela</span>
                </li>
                <li className="flex gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">4</span>
                  <span>Pronto! A página do visitante abrirá automaticamente</span>
                </li>
              </ol>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              💡 A maioria dos celulares modernos escaneiam QR codes automaticamente pela câmera
            </p>

            <Button className="w-full" onClick={() => setShowCameraHint(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
