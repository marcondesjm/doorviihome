import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, Video, X, Phone, CheckCircle2, Bell, Download, Settings2, Package, Plus, Trash2, Upload, Volume2, Pencil, FileImage, FileText, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect } from "react";
import { StyledQRCode, defaultCustomization, defaultDeliveryIcons, QRCustomization, DeliveryIcon } from "./StyledQRCode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeliveryIcons } from "@/hooks/useDeliveryIcons";
import { ApprovalReminderAlert } from "@/components/ApprovalReminderAlert";
import jsPDF from "jspdf";

const colorPresets = [
  { name: 'Clássico', bgColor: '#ffffff', fgColor: '#1a1a2e' },
  { name: 'Azul', bgColor: '#e0f2fe', fgColor: '#0c4a6e' },
  { name: 'Verde', bgColor: '#dcfce7', fgColor: '#14532d' },
  { name: 'Roxo', bgColor: '#f3e8ff', fgColor: '#581c87' },
  { name: 'Laranja', bgColor: '#ffedd5', fgColor: '#9a3412' },
  { name: 'Rosa', bgColor: '#fce7f3', fgColor: '#9d174d' },
];

const emojiOptions = ['🔔', '📦', '🏠', '🚪', '📱', '🔑', '⭐', '🎯'];

// Helper function to detect if URL is a video file
const isVideoUrl = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('visitor_video') || 
         lowerUrl.includes('.webm') || 
         lowerUrl.includes('.mp4') ||
         lowerUrl.includes('video/');
};

interface VideoCallQRCodeProps {
  roomName: string;
  propertyName: string;
  onClose: () => void;
  onStartCall?: () => void;
  visitorJoined?: boolean;
  meetLink?: string | null;
  doorbellRinging?: boolean;
  waitingForApproval?: boolean;
  onApprovalDismiss?: () => void;
  visitorAudioResponse?: string | null;
}

export const VideoCallQRCode = ({
  roomName,
  propertyName,
  onClose,
  onStartCall,
  visitorJoined = false,
  meetLink,
  doorbellRinging = false,
  waitingForApproval = false,
  onApprovalDismiss,
  visitorAudioResponse,
}: VideoCallQRCodeProps) => {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customization, setCustomization] = useState<QRCustomization>({
    ...defaultCustomization,
    title: "ESCANEIE O QR CODE",
    subtitle: "PARA ENTRAR EM CONTATO",
    iconSize: 'medium',
  });
  const [newIconName, setNewIconName] = useState("");
  const [newIconUrl, setNewIconUrl] = useState("");
  const [showAddIcon, setShowAddIcon] = useState(false);
  const [editingIcon, setEditingIcon] = useState<DeliveryIcon | null>(null);

  const { deliveryIcons, addIcon, updateIcon, removeIcon, hideDefaultIcon, hiddenDefaults, restoreAllDefaults, moveIconUp, moveIconDown } = useDeliveryIcons();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem (PNG, JPG, etc)",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setNewIconUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDeliveryIcon = async () => {
    if (!newIconName.trim() || !newIconUrl.trim()) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome e URL da imagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await addIcon.mutateAsync({
        name: newIconName.trim(),
        url: newIconUrl.trim(),
      });
      
      setNewIconName("");
      setNewIconUrl("");
      setShowAddIcon(false);
      toast({
        title: "Ícone adicionado!",
        description: `${newIconName.trim()} foi adicionado à lista`,
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível salvar o ícone",
        variant: "destructive",
      });
    }
  };

  const handleEditDeliveryIcon = async (icon: DeliveryIcon) => {
    const isDefaultIcon = defaultDeliveryIcons.some(d => d.id === icon.id);
    
    if (isDefaultIcon) {
      // For default icons, we'll create a new custom one with the same data
      // and hide the default
      setEditingIcon({ ...icon, id: `custom-${icon.id}` }); // Mark as custom copy
      setNewIconName(icon.name);
      setNewIconUrl(icon.url);
      setShowAddIcon(true);
    } else {
      setEditingIcon(icon);
      setNewIconName(icon.name);
      setNewIconUrl(icon.url);
      setShowAddIcon(true);
    }
  };

  const handleUpdateDeliveryIcon = async () => {
    if (!editingIcon || !newIconName.trim() || !newIconUrl.trim()) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome e URL da imagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Check if editing a default icon (ID starts with "custom-")
    const isEditingDefault = editingIcon.id.startsWith("custom-");
    const originalDefaultId = isEditingDefault ? editingIcon.id.replace("custom-", "") : null;
    
    try {
      if (isEditingDefault && originalDefaultId) {
        // Create new custom icon and hide the default
        await addIcon.mutateAsync({
          name: newIconName.trim(),
          url: newIconUrl.trim(),
        });
        hideDefaultIcon(originalDefaultId);
        toast({
          title: "Ícone personalizado!",
          description: `${newIconName.trim()} foi personalizado com sucesso`,
        });
      } else {
        // Regular update for custom icons
        await updateIcon.mutateAsync({
          id: editingIcon.id,
          name: newIconName.trim(),
          url: newIconUrl.trim(),
        });
        toast({
          title: "Ícone atualizado!",
          description: `${newIconName.trim()} foi atualizado com sucesso`,
        });
      }
      
      setNewIconName("");
      setNewIconUrl("");
      setShowAddIcon(false);
      setEditingIcon(null);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o ícone",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDeliveryIcon = async (id: string) => {
    const isDefaultIcon = defaultDeliveryIcons.some(icon => icon.id === id);
    
    if (isDefaultIcon) {
      // Hide the default icon instead of deleting
      hideDefaultIcon(id);
      toast({
        title: "Ícone ocultado",
        description: "O ícone padrão foi ocultado. Use 'Restaurar padrões' para trazer de volta.",
      });
      return;
    }

    try {
      await removeIcon.mutateAsync(id);
      toast({
        title: "Ícone removido",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o ícone",
        variant: "destructive",
      });
    }
  };

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

  const generateQRImage = async (): Promise<HTMLCanvasElement | null> => {
    if (!qrRef.current) return null;

    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return null;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // A4 optimized dimensions (794 x 1123 pixels at 96 DPI, scaled up 1.5x for print quality)
      const scale = 1.5;
      const canvasWidth = Math.round(794 * scale);
      const qrSize = Math.round(400 * scale);
      const padding = Math.round(60 * scale);
      const headerHeight = Math.round(200 * scale);
      const warningHeight = Math.round(120 * scale);
      
      // Calculate delivery section height based on rows (max 4 per row)
      const iconsPerRow = 4;
      const rowCount = deliveryIcons.length > 0 ? Math.ceil(deliveryIcons.length / iconsPerRow) : 0;
      const iconRowHeights = { small: 70, medium: 90, large: 110 };
      const iconRowHeight = Math.round(iconRowHeights[customization.iconSize] * scale);
      const deliveryHeight = deliveryIcons.length > 0 ? Math.round(60 * scale) + (rowCount * iconRowHeight) + Math.round(20 * scale) : 0;
      const securityNoticeHeight = Math.round(60 * scale);
      const footerHeight = Math.round(50 * scale);
      
      canvas.width = canvasWidth;
      canvas.height = headerHeight + qrSize + Math.round(50 * scale) + warningHeight + deliveryHeight + securityNoticeHeight + footerHeight;

      return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = async () => {
          if (!ctx) {
            resolve(null);
            return;
          }
          
          // Background
          ctx.fillStyle = customization.bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Logo emoji
          ctx.font = `${Math.round(80 * scale)}px system-ui`;
          ctx.textAlign = 'center';
          ctx.fillText(customization.logoText, canvas.width / 2, Math.round(80 * scale));
          
          // "CAMPAINHA VIRTUAL" text
          ctx.fillStyle = customization.fgColor;
          ctx.font = `bold ${Math.round(24 * scale)}px system-ui`;
          ctx.fillText('CAMPAINHA VIRTUAL', canvas.width / 2, Math.round(120 * scale));
          
          // Title
          ctx.fillStyle = customization.fgColor;
          ctx.font = `bold ${Math.round(28 * scale)}px system-ui`;
          ctx.fillText(customization.title, canvas.width / 2, Math.round(160 * scale));
          
          // Subtitle
          ctx.font = `${Math.round(22 * scale)}px system-ui`;
          ctx.fillStyle = '#666';
          ctx.fillText(customization.subtitle, canvas.width / 2, Math.round(190 * scale));
          
          // QR Code centered
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = headerHeight;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          
          // Warning box
          const warningY = qrY + qrSize + Math.round(30 * scale);
          ctx.fillStyle = '#fef3c7';
          const boxWidth = canvas.width - padding * 2;
          ctx.fillRect(padding, warningY, boxWidth, warningHeight - Math.round(15 * scale));
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = Math.round(3 * scale);
          ctx.strokeRect(padding, warningY, boxWidth, warningHeight - Math.round(15 * scale));
          
          ctx.fillStyle = '#92400e';
          ctx.font = `bold ${Math.round(20 * scale)}px system-ui`;
          ctx.fillText('⚠️ Por favor, nao bata ou soe a campainha fisica.', canvas.width / 2, warningY + Math.round(35 * scale));
          ctx.fillText('Use a do Aplicativo.', canvas.width / 2, warningY + Math.round(60 * scale));
          ctx.fillStyle = '#b45309';
          ctx.font = `${Math.round(18 * scale)}px system-ui`;
          ctx.fillText('📱 Escaneie o QR Code Usando a Camera ou um App', canvas.width / 2, warningY + Math.round(88 * scale));
          
          // Delivery icons section
          if (deliveryIcons.length > 0) {
            const deliveryY = warningY + warningHeight + Math.round(10 * scale);
            const deliveryBoxHeight = Math.round(55 * scale) + (rowCount * iconRowHeight);
            
            ctx.fillStyle = '#eff6ff';
            ctx.fillRect(padding, deliveryY, boxWidth, deliveryBoxHeight);
            ctx.strokeStyle = '#bfdbfe';
            ctx.lineWidth = Math.round(3 * scale);
            ctx.strokeRect(padding, deliveryY, boxWidth, deliveryBoxHeight);
            
            ctx.fillStyle = '#1e40af';
            ctx.font = `bold ${Math.round(22 * scale)}px system-ui`;
            ctx.fillText('📦 Entregas:', canvas.width / 2, deliveryY + Math.round(35 * scale));
            
            const iconPromises = deliveryIcons.map((icon, index) => {
              return new Promise<void>((resolveIcon) => {
                const iconImg = new Image();
                iconImg.crossOrigin = 'anonymous';
                iconImg.onload = () => {
                  // Size based on customization - maintain aspect ratio
                  const iconHeights = { small: 45, medium: 60, large: 80 };
                  const targetHeight = Math.round(iconHeights[customization.iconSize] * scale);
                  
                  // Calculate width maintaining aspect ratio
                  const aspectRatio = iconImg.naturalWidth / iconImg.naturalHeight;
                  const iconHeight = targetHeight;
                  const iconWidth = Math.min(targetHeight * aspectRatio, Math.round(120 * scale));
                  const gap = Math.round(25 * scale);
                  
                  // Calculate row and column
                  const row = Math.floor(index / iconsPerRow);
                  const col = index % iconsPerRow;
                  const iconsInThisRow = Math.min(iconsPerRow, deliveryIcons.length - row * iconsPerRow);
                  
                  // Calculate width for this row
                  const maxIconWidth = Math.round(100 * scale);
                  const rowWidth = iconsInThisRow * maxIconWidth + (iconsInThisRow - 1) * gap;
                  const rowStartX = (canvas.width - rowWidth) / 2;
                  const iconCenterX = rowStartX + col * (maxIconWidth + gap) + maxIconWidth / 2;
                  const iconX = iconCenterX - iconWidth / 2;
                  const iconY = deliveryY + Math.round(55 * scale) + row * iconRowHeight;
                  
                  // Icon background
                  ctx.fillStyle = '#ffffff';
                  const bgPadding = Math.round(10 * scale);
                  ctx.fillRect(iconX - bgPadding, iconY, iconWidth + bgPadding * 2, iconHeight + bgPadding * 2);
                  ctx.strokeStyle = '#e2e8f0';
                  ctx.lineWidth = Math.round(2 * scale);
                  ctx.strokeRect(iconX - bgPadding, iconY, iconWidth + bgPadding * 2, iconHeight + bgPadding * 2);
                  
                  ctx.drawImage(iconImg, iconX, iconY + bgPadding, iconWidth, iconHeight);
                  resolveIcon();
                };
                iconImg.onerror = () => resolveIcon();
                iconImg.src = icon.url.startsWith('/') ? window.location.origin + icon.url : icon.url;
              });
            });
            
            await Promise.all(iconPromises);
          }
          
          // Security notice - "SORRIA, VOCÊ ESTÁ SENDO FILMADO"
          const securityY = deliveryIcons.length > 0 
            ? warningY + warningHeight + Math.round(10 * scale) + Math.round(55 * scale) + (Math.ceil(deliveryIcons.length / iconsPerRow) * iconRowHeight) + Math.round(25 * scale)
            : warningY + warningHeight + Math.round(25 * scale);
          
          ctx.fillStyle = '#fef2f2';
          ctx.fillRect(padding, securityY, boxWidth, Math.round(45 * scale));
          ctx.strokeStyle = '#fecaca';
          ctx.lineWidth = Math.round(2 * scale);
          ctx.strokeRect(padding, securityY, boxWidth, Math.round(45 * scale));
          
          ctx.fillStyle = '#b91c1c';
          ctx.font = `bold ${Math.round(18 * scale)}px system-ui`;
          ctx.fillText('📹 SORRIA, VOCÊ ESTÁ SENDO FILMADO', canvas.width / 2, securityY + Math.round(30 * scale));
          
          resolve(canvas);
        };
        
        img.onerror = () => resolve(null);
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      });
    } catch (e) {
      console.error('Erro ao gerar imagem:', e);
      return null;
    }
  };

  const handleDownloadPNG = async () => {
    const canvas = await generateQRImage();
    if (!canvas) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar a imagem.",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement('a');
    link.download = `qrcode-${propertyName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast({
      title: "QR Code baixado!",
      description: "A imagem PNG foi salva no seu dispositivo.",
    });
  };

  const handleDownloadJPG = async () => {
    const canvas = await generateQRImage();
    if (!canvas) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar a imagem.",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement('a');
    link.download = `qrcode-${propertyName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    
    toast({
      title: "QR Code baixado!",
      description: "A imagem JPG foi salva no seu dispositivo.",
    });
  };

  const handleDownloadPDF = async () => {
    const canvas = await generateQRImage();
    if (!canvas) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate image dimensions to fit nicely on A4
    const imgWidth = 140;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    const x = (pdfWidth - imgWidth) / 2;
    const y = 30;

    // Add title
    pdf.setFontSize(18);
    pdf.setTextColor(51, 51, 51);
    pdf.text(`QR Code - ${propertyName}`, pdfWidth / 2, 20, { align: 'center' });

    // Add image
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

    // Add footer
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Gerado automaticamente pelo sistema de portaria inteligente', pdfWidth / 2, pdfHeight - 10, { align: 'center' });

    pdf.save(`qrcode-${propertyName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    
    toast({
      title: "PDF baixado!",
      description: "O arquivo PDF foi salvo no seu dispositivo.",
    });
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

        {/* Approval Reminder Alert - Inside the container */}
        <ApprovalReminderAlert
          isVisible={waitingForApproval}
          onDismiss={onApprovalDismiss || (() => {})}
          propertyName={propertyName}
        />

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
            deliveryIcons={deliveryIcons}
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

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 justify-center flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Download className="w-4 h-4" />
                  Baixar
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={handleDownloadPNG}>
                  <FileImage className="w-4 h-4 mr-2" />
                  PNG (Imagem)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadJPG}>
                  <FileImage className="w-4 h-4 mr-2" />
                  JPG (Imagem)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF (Documento)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Visitor Media Response */}
        {visitorAudioResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-primary/20 border border-primary/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              {isVideoUrl(visitorAudioResponse) ? (
                <Video className="w-4 h-4 text-primary" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-medium text-primary">Resposta do visitante</span>
            </div>
            {isVideoUrl(visitorAudioResponse) ? (
              <video 
                src={visitorAudioResponse} 
                controls 
                playsInline
                className="w-full rounded-lg max-h-48"
                autoPlay
              />
            ) : (
              <audio 
                src={visitorAudioResponse} 
                controls 
                className="w-full h-10"
                autoPlay
              />
            )}
          </motion.div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Clique em "Entrar na chamada" para iniciar a videochamada do seu lado
        </p>

        {/* Customization Dialog */}
        <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Personalizar QR Code</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="appearance">Aparência</TabsTrigger>
                <TabsTrigger value="delivery">Entregadores</TabsTrigger>
              </TabsList>
              
              <TabsContent value="appearance" className="space-y-4 mt-4">
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
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4 mt-4">
                {/* Icon Size Control */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Tamanho dos ícones
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'small', label: 'Pequeno' },
                      { value: 'medium', label: 'Médio' },
                      { value: 'large', label: 'Grande' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCustomization({ ...customization, iconSize: option.value })}
                        className={`p-2 rounded-lg border-2 transition-all text-sm ${
                          customization.iconSize === option.value
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Icons */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Transportadoras cadastradas
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {deliveryIcons.map((icon, index) => {
                      const isDefaultIcon = defaultDeliveryIcons.some(d => d.id === icon.id);
                      const isFirst = index === 0;
                      const isLast = index === deliveryIcons.length - 1;
                      
                      return (
                        <div 
                          key={icon.id} 
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                        >
                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-primary disabled:opacity-30"
                              onClick={() => moveIconUp(icon.id)}
                              disabled={isFirst}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-muted-foreground hover:text-primary disabled:opacity-30"
                              onClick={() => moveIconDown(icon.id)}
                              disabled={isLast}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <img 
                            src={icon.url} 
                            alt={icon.name} 
                            className="h-6 w-auto object-contain" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect fill="%23ccc" width="24" height="24"/><text x="50%" y="50%" fill="%23666" text-anchor="middle" dominant-baseline="middle" font-size="8">?</text></svg>';
                            }}
                          />
                          <span className="flex-1 text-sm truncate">{icon.name}</span>
                          <div className="flex items-center gap-1">
                            {isDefaultIcon && (
                              <span className="text-xs text-muted-foreground mr-1">Padrão</span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditDeliveryIcon(icon)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveDeliveryIcon(icon.id)}
                              disabled={removeIcon.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {deliveryIcons.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma transportadora cadastrada
                      </p>
                    )}
                  </div>
                  
                  {/* Restore defaults button */}
                  {hiddenDefaults.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => {
                        restoreAllDefaults();
                        toast({
                          title: "Padrões restaurados",
                          description: "Os ícones padrão foram restaurados",
                        });
                      }}
                    >
                      Restaurar ícones padrão ({hiddenDefaults.length} oculto{hiddenDefaults.length > 1 ? 's' : ''})
                    </Button>
                  )}
                </div>
                
                {/* Add/Edit Icon Form */}
                {showAddIcon ? (
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                    <p className="text-sm font-medium text-primary">{editingIcon ? "Editar transportadora" : "Nova transportadora"}</p>
                    <div className="space-y-2">
                      <Label>Nome da transportadora</Label>
                      <Input
                        value={newIconName}
                        onChange={(e) => setNewIconName(e.target.value)}
                        placeholder="Ex: Jadlog"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newIconUrl}
                          onChange={(e) => setNewIconUrl(e.target.value)}
                          placeholder="URL ou selecione arquivo"
                          className="flex-1"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      {newIconUrl && (
                        <div className="flex items-center gap-2 p-2 bg-background rounded border">
                          <img 
                            src={newIconUrl} 
                            alt="Preview" 
                            className="h-8 w-auto object-contain" 
                          />
                          <span className="text-xs text-muted-foreground">Preview</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setShowAddIcon(false);
                          setNewIconName("");
                          setNewIconUrl("");
                          setEditingIcon(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={editingIcon ? handleUpdateDeliveryIcon : handleAddDeliveryIcon}
                        disabled={addIcon.isPending || updateIcon.isPending}
                      >
                        {(addIcon.isPending || updateIcon.isPending) ? "Salvando..." : editingIcon ? "Salvar" : "Adicionar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setShowAddIcon(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar transportadora
                  </Button>
                )}
              </TabsContent>
            </Tabs>

            <Button onClick={() => setShowCustomize(false)} className="w-full mt-4">
              Concluir
            </Button>
          </DialogContent>
        </Dialog>
      </motion.div>
    </motion.div>
  );
};
