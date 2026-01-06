import { useState, useRef, useEffect } from "react";
import doorviiLogo from "@/assets/doorvii-logo.png";
import doorviiLogoFull from "@/assets/doorvii-logo-full.png";
import doorviiBrandLogo from "@/assets/doorvii-logo-nobg.png";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { 
  Copy, 
  Share2, 
  Download, 
  Printer, 
  Palette,
  Camera,
  Check,
  ArrowLeft,
  RefreshCw,
  Home,
  Eye,
  Package,
  Plus,
  X,
  Trash2,
  Upload,
  Layout,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { IncomingCall } from "@/components/IncomingCall";
import { useDoorbellListener } from "@/hooks/useDoorbellListener";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";

import { useProperties } from "@/hooks/useProperties";
import { useGenerateAccessCode, useAccessCodes } from "@/hooks/useAccessCodes";
import { useDeliveryIcons } from "@/hooks/useDeliveryIcons";
import { defaultDeliveryIcons, DeliveryIcon } from "@/components/StyledQRCode";
import { StyledQRCodeSimple, QRSimpleCustomization, defaultSimpleCustomization } from "@/components/StyledQRCodeSimple";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QRCodeModelType = "classic" | "simple";

interface QRCustomization {
  title: string;
  subtitle: string;
  fgColor: string;
  bgColor: string;
  logoText: string;
  size: number;
}

const colorPresets = [
  { name: "Azul", fg: "#ffffff", bg: "#2563eb" },
  { name: "Azul Claro", fg: "#1e40af", bg: "#dbeafe" },
  { name: "Verde", fg: "#166534", bg: "#dcfce7" },
  { name: "Roxo", fg: "#6b21a8", bg: "#f3e8ff" },
  { name: "Laranja", fg: "#c2410c", bg: "#ffedd5" },
  { name: "Vermelho", fg: "#b91c1c", bg: "#fee2e2" },
  { name: "Preto", fg: "#000000", bg: "#ffffff" },
  { name: "Teal", fg: "#0d9488", bg: "#ccfbf1" },
];

const sizePresets = [
  { name: "Pequeno", value: 150 },
  { name: "Médio", value: 200 },
  { name: "Grande", value: 280 },
  { name: "Extra Grande", value: 350 },
];

// DeliveryIcon interface is imported from StyledQRCode

const QRCodePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const { propertyId: urlPropertyId } = useParams<{ propertyId: string }>();
  
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: accessCodes, isLoading: accessCodesLoading } = useAccessCodes();
  const generateCode = useGenerateAccessCode();
  const { deliveryIcons, addIcon, removeIcon, hideDefaultIcon, hiddenDefaults, restoreAllDefaults, moveIconUp, moveIconDown } = useDeliveryIcons();
  const { doorbellState, dismissDoorbell } = useDoorbellListener();
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<QRCodeModelType>("classic");
  
  const selectedProperty = properties?.find(p => p.id === selectedPropertyId) || properties?.[0];
  
  // Find access code for the selected property - only use code that belongs to the selected property
  const propertyAccessCode = accessCodes?.find(code => code.property_id === selectedPropertyId);
  const hasCodeForProperty = !!propertyAccessCode;
  
  // Set property from URL parameter or default to first property
  useEffect(() => {
    if (properties && properties.length > 0) {
      if (urlPropertyId && properties.some(p => p.id === urlPropertyId)) {
        setSelectedPropertyId(urlPropertyId);
      } else if (!selectedPropertyId) {
        setSelectedPropertyId(properties[0].id);
      }
    }
  }, [properties, selectedPropertyId, urlPropertyId]);

  // Auto-generate access code if property doesn't have one
  useEffect(() => {
    if (selectedPropertyId && accessCodes !== undefined) {
      const hasCode = accessCodes?.some(code => code.property_id === selectedPropertyId);
      if (!hasCode && !generateCode.isPending) {
        generateCode.mutateAsync({ propertyId: selectedPropertyId });
      }
    }
  }, [selectedPropertyId, accessCodes]);
  
  const [customization, setCustomization] = useState<QRCustomization>({
    title: "ESCANEIE O QR CODE PARA ENTRAR EM CONTATO",
    subtitle: selectedProperty?.name || "Minha Propriedade",
    fgColor: "#ffffff",
    bgColor: "#2563eb",
    logoText: "🔔",
    size: 200,
  });

  const [newIconName, setNewIconName] = useState("");
  const [newIconUrl, setNewIconUrl] = useState("");
  const [showAddIcon, setShowAddIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Simple model customization
  const [simpleCustomization, setSimpleCustomization] = useState<QRSimpleCustomization>({
    ...defaultSimpleCustomization,
    websiteUrl: window.location.origin.replace('https://', '').replace('http://', ''),
  });

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

  const handleRemoveDeliveryIcon = async (id: string) => {
    const isDefaultIcon = defaultDeliveryIcons.some(icon => icon.id === id);
    
    if (isDefaultIcon) {
      // Hide the default icon instead of showing error
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

  // Update subtitle when property changes
  useEffect(() => {
    if (selectedProperty) {
      setCustomization(prev => ({
        ...prev,
        subtitle: selectedProperty.name
      }));
    }
  }, [selectedProperty]);

  // Generate the visitor URL
  const visitorUrl = propertyAccessCode 
    ? `${window.location.origin}/call/${encodeURIComponent(propertyAccessCode.code)}?property=${encodeURIComponent(selectedProperty?.name || 'Propriedade')}`
    : `${window.location.origin}/call/demo?property=Demo`;

  const handleGenerateCode = async () => {
    await generateCode.mutateAsync({ 
      propertyId: selectedPropertyId || undefined
    });
    toast({
      title: "QR Code gerado!",
      description: "Código permanente criado com sucesso",
    });
  };

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
          title: `Acesso para ${selectedProperty?.name || 'Propriedade'}`,
          text: `Escaneie o QR Code ou acesse o link para entrar em contato`,
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
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (selectedModel === 'simple') {
        // Simple model download - Fixed size 7cm x 11cm (265x416 pixels at 96dpi)
        const cardWidth = 265;
        const cardHeight = 416;
        const borderRadius = 24;
        const qrSize = 140;
        
        canvas.width = cardWidth;
        canvas.height = cardHeight;
        
        img.onload = async () => {
          if (!ctx) return;
          
          // Clear canvas with transparency
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw rounded rectangle background
          ctx.fillStyle = simpleCustomization.primaryColor;
          ctx.beginPath();
          ctx.roundRect(0, 0, cardWidth, cardHeight, borderRadius);
          ctx.fill();
          
          // Draw darker header banner
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(0, 0, cardWidth, 60, [borderRadius, borderRadius, 0, 0]);
          ctx.clip();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fillRect(0, 0, cardWidth, 60);
          ctx.restore();
          
          // Draw header text with shadow
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px system-ui';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText(simpleCustomization.headerText, cardWidth / 2, 28);
          
          // Draw subheader
          ctx.font = '11px system-ui';
          ctx.fillText('ENTRAR EM CONTATO', cardWidth / 2, 46);
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Draw QR code container background
          const qrContainerSize = qrSize + 16;
          const qrContainerX = (cardWidth - qrContainerSize) / 2;
          const qrContainerY = 70;
          ctx.fillStyle = '#f3f4f6';
          ctx.beginPath();
          ctx.roundRect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 12);
          ctx.fill();
          
          // Draw QR code centered
          const qrX = (cardWidth - qrSize) / 2;
          const qrY = qrContainerY + 8;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          
          // Draw logo in center of QR code
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          
          const finishDownload = () => {
            // Draw footer text with shadow
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px system-ui';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            const footerY = qrContainerY + qrContainerSize + 28;
            ctx.fillText(simpleCustomization.footerText, cardWidth / 2, footerY);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw white line separator
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(20, footerY + 12, cardWidth - 40, 2);
            
            // Draw brand background with logo
            const brandBgWidth = 160;
            const brandBgHeight = 36;
            const brandY = footerY + 28;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect((cardWidth - brandBgWidth) / 2, brandY, brandBgWidth, brandBgHeight, 8);
            ctx.fill();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3;
            ctx.beginPath();
            ctx.roundRect((cardWidth - brandBgWidth) / 2, brandY, brandBgWidth, brandBgHeight, 8);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw logo in brand area
            const brandLogoImg = new Image();
            brandLogoImg.crossOrigin = 'anonymous';
            brandLogoImg.onload = () => {
              const logoHeight = 28;
              const logoWidth = (brandLogoImg.width / brandLogoImg.height) * logoHeight;
              ctx.drawImage(brandLogoImg, (cardWidth - logoWidth) / 2, brandY + 4, logoWidth, logoHeight);
              
              // Draw website URL
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 13px system-ui';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
              ctx.shadowBlur = 3;
              ctx.fillText(simpleCustomization.websiteUrl, cardWidth / 2, brandY + brandBgHeight + 24);
              ctx.shadowBlur = 0;
              
              // Download
              const link = document.createElement('a');
              link.download = `qrcode-simples-${selectedProperty?.name?.replace(/\s+/g, '-').toLowerCase() || 'propriedade'}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
              
              toast({
                title: "QR Code baixado!",
                description: "A imagem foi salva com cantos arredondados.",
              });
            };
            brandLogoImg.onerror = () => {
              // Fallback to text if logo fails
              ctx.fillStyle = simpleCustomization.primaryColor;
              ctx.font = 'bold 16px system-ui';
              ctx.fillText('DoorVii', cardWidth / 2, brandY + 24);
              
              // Draw website URL
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 13px system-ui';
              ctx.fillText(simpleCustomization.websiteUrl, cardWidth / 2, brandY + brandBgHeight + 24);
              
              // Download
              const link = document.createElement('a');
              link.download = `qrcode-simples-${selectedProperty?.name?.replace(/\s+/g, '-').toLowerCase() || 'propriedade'}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
              
              toast({
                title: "QR Code baixado!",
                description: "A imagem foi salva com cantos arredondados.",
              });
            };
            // Use the imported brand logo
            brandLogoImg.src = doorviiBrandLogo;
          };
          
          logoImg.onload = () => {
            // Draw white background for center logo
            const centerLogoSize = 40;
            const centerX = cardWidth / 2 - centerLogoSize / 2;
            const centerY = qrY + qrSize / 2 - centerLogoSize / 2;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(centerX - 2, centerY - 2, centerLogoSize + 4, centerLogoSize + 4, 4);
            ctx.fill();
            ctx.drawImage(logoImg, centerX, centerY, centerLogoSize, centerLogoSize);
            finishDownload();
          };
          logoImg.onerror = () => {
            finishDownload();
          };
          logoImg.src = doorviiLogo;
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      } else {
        // Classic model download
        const padding = 40;
        const qrSize = customization.size;
        // Calculate rows for delivery icons (max 4 per row)
        const iconsPerRow = 4;
        const iconRows = deliveryIcons.length > 0 ? Math.ceil(deliveryIcons.length / iconsPerRow) : 0;
        const deliveryHeight = deliveryIcons.length > 0 ? 110 + (iconRows * 65) : 0;
        canvas.width = Math.max(qrSize + padding * 2, 450);
        canvas.height = qrSize + 340 + deliveryHeight;
        
        img.onload = async () => {
          if (!ctx) return;
          
          // Fill background with blue
          ctx.fillStyle = customization.bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw logo emoji
          ctx.font = '48px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(customization.logoText, canvas.width / 2, 55);
          
          // Draw title in white
          ctx.fillStyle = customization.fgColor;
          ctx.font = 'bold 18px system-ui';
          const titleLines = customization.title.split(' ');
          let titleY = 95;
          if (customization.title.length > 30) {
            const midPoint = Math.ceil(titleLines.length / 2);
            const line1 = titleLines.slice(0, midPoint).join(' ');
            const line2 = titleLines.slice(midPoint).join(' ');
            ctx.fillText(line1, canvas.width / 2, titleY);
            ctx.fillText(line2, canvas.width / 2, titleY + 22);
            titleY += 22;
          } else {
            ctx.fillText(customization.title, canvas.width / 2, titleY);
          }
          
          // Draw subtitle in white with opacity
          ctx.font = '16px system-ui';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(customization.subtitle, canvas.width / 2, titleY + 25);
          
          // Draw white rounded container for QR code
          const qrContainerSize = qrSize + 32;
          const qrContainerX = (canvas.width - qrContainerSize) / 2;
          const qrContainerY = titleY + 50;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 16);
          ctx.fill();
          
          // Draw QR code centered in white container
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = qrContainerY + 16;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          
          // Draw camera logo in center of QR code
          const cameraImg = new Image();
          cameraImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            cameraImg.onload = () => {
              const cameraSize = 64;
              const cameraX = (canvas.width - cameraSize) / 2;
              const cameraY = qrY + (qrSize - cameraSize) / 2;
              ctx.drawImage(cameraImg, cameraX, cameraY, cameraSize, cameraSize);
              resolve();
            };
            cameraImg.onerror = () => resolve();
            cameraImg.src = window.location.origin + '/doorvii-camera.png';
          });
          
          const warningY = qrContainerY + qrContainerSize + 20;
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.roundRect(padding / 2, warningY, canvas.width - padding, 60, 12);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(padding / 2, warningY, canvas.width - padding, 60, 12);
          ctx.stroke();
          
          ctx.fillStyle = '#92400e';
          ctx.font = 'bold 12px system-ui';
          ctx.fillText('⚠️ Por favor, não bata ou soe a campainha física. Use a do Aplicativo.', canvas.width / 2, warningY + 25);
          ctx.fillStyle = '#b45309';
          ctx.font = '12px system-ui';
          ctx.fillText('📱 Escaneie o QR Code Usando a Câmera ou um App', canvas.width / 2, warningY + 45);
          
          // Draw delivery icons section if exists
          if (deliveryIcons.length > 0) {
            const deliveryY = warningY + 80;
            const iconsPerRow = 4;
            const iconRows = Math.ceil(deliveryIcons.length / iconsPerRow);
            const sectionHeight = 90 + (iconRows * 60);
            
            // Draw delivery section background
            ctx.fillStyle = '#eff6ff';
            ctx.beginPath();
            ctx.roundRect(padding / 2, deliveryY, canvas.width - padding, sectionHeight, 12);
            ctx.fill();
            ctx.strokeStyle = '#bfdbfe';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(padding / 2, deliveryY, canvas.width - padding, sectionHeight, 12);
            ctx.stroke();
            
            // Draw DoorVii logo above entregas
            const doorviiLogoForDownload = new Image();
            doorviiLogoForDownload.crossOrigin = 'anonymous';
            await new Promise<void>((resolve) => {
              doorviiLogoForDownload.onload = () => {
                const logoHeight = 35;
                const logoWidth = (doorviiLogoForDownload.width / doorviiLogoForDownload.height) * logoHeight;
                ctx.drawImage(doorviiLogoForDownload, (canvas.width - logoWidth) / 2, deliveryY + 10, logoWidth, logoHeight);
                resolve();
              };
              doorviiLogoForDownload.onerror = () => resolve();
              doorviiLogoForDownload.src = window.location.origin + '/doorvii-logo-entregas.png';
            });
            
            // Draw website URL below logo
            ctx.fillStyle = '#2563eb';
            ctx.font = '11px system-ui';
            ctx.fillText('www.doorvii.com.br', canvas.width / 2, deliveryY + 50);
            
            ctx.fillStyle = '#1e40af';
            ctx.font = 'bold 14px system-ui';
            ctx.fillText('📦 Entregas:', canvas.width / 2, deliveryY + 72);
            
            // Load and draw delivery icons in rows
            const iconWidth = 55;
            const iconHeight = 44;
            const iconGap = 10;
            
            const iconPromises = deliveryIcons.map((icon, index) => {
              return new Promise<void>((resolve) => {
                const iconImg = new Image();
                iconImg.crossOrigin = 'anonymous';
                iconImg.onload = () => {
                  const row = Math.floor(index / iconsPerRow);
                  const col = index % iconsPerRow;
                  const iconsInThisRow = Math.min(iconsPerRow, deliveryIcons.length - row * iconsPerRow);
                  const rowWidth = iconsInThisRow * (iconWidth + iconGap) - iconGap;
                  const rowStartX = (canvas.width - rowWidth) / 2;
                  
                  const iconX = rowStartX + col * (iconWidth + iconGap);
                  const iconY = deliveryY + 90 + (row * 58);
                  
                  // Draw white background for icon
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.roundRect(iconX, iconY, iconWidth, iconHeight + 8, 8);
                  ctx.fill();
                  ctx.strokeStyle = '#e2e8f0';
                  ctx.beginPath();
                  ctx.roundRect(iconX, iconY, iconWidth, iconHeight + 8, 8);
                  ctx.stroke();
                  
                  // Center the icon image inside the container
                  const imgWidth = iconWidth - 10;
                  const imgHeight = iconHeight - 4;
                  ctx.drawImage(iconImg, iconX + 5, iconY + 4, imgWidth, imgHeight);
                  resolve();
                };
                iconImg.onerror = () => resolve();
                iconImg.src = icon.url.startsWith('/') ? window.location.origin + icon.url : icon.url;
              });
            });
            
            await Promise.all(iconPromises);
          }
          
          // Download
          const link = document.createElement('a');
          link.download = `qrcode-${selectedProperty?.name?.replace(/\s+/g, '-').toLowerCase() || 'propriedade'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          
          toast({
            title: "QR Code baixado!",
            description: "A imagem foi salva no seu dispositivo.",
          });
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
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

    if (selectedModel === 'simple') {
      // Simple model print
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${selectedProperty?.name || 'Propriedade'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 40px;
              background: white;
            }
            .container {
              text-align: center;
              max-width: 400px;
              padding: 40px;
              background: ${simpleCustomization.primaryColor};
              border-radius: 24px;
            }
            .header-text {
              color: white;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 24px;
              letter-spacing: 1px;
            }
            .qr-container { 
              background: #f3f4f6; 
              padding: 20px; 
              border-radius: 16px; 
              display: inline-block;
              margin-bottom: 24px;
              position: relative;
            }
            .qr-container svg {
              width: ${simpleCustomization.qrSize}px;
              height: ${simpleCustomization.qrSize}px;
            }
            .center-logo {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 4px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .center-logo img {
              width: 56px;
              height: 56px;
              object-fit: contain;
            }
            .footer-text {
              color: white;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 16px;
              letter-spacing: 1px;
            }
            .brand-container {
              background: white;
              padding: 8px 24px;
              border-radius: 8px;
              display: inline-block;
              margin-bottom: 8px;
            }
            .brand-container img {
              height: 36px;
              object-fit: contain;
            }
            .website-url {
              color: rgba(255,255,255,0.8);
              font-size: 14px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-text">${simpleCustomization.headerText}</div>
            <div class="qr-container">
              ${svgData}
              <div class="center-logo">
                <img src="${doorviiLogo}" alt="DoorVii" />
              </div>
            </div>
            <div class="footer-text">${simpleCustomization.footerText}</div>
            <div class="brand-container">
              <img src="${doorviiLogoFull}" alt="DoorVii" />
            </div>
            <div class="website-url">${simpleCustomization.websiteUrl}</div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          <\/script>
        </body>
        </html>
      `);
    } else {
      // Classic model print - matching download style
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${selectedProperty?.name || 'Propriedade'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 40px;
              background: white;
            }
            .container {
              text-align: center;
              max-width: 450px;
              padding: 40px;
              background: ${customization.bgColor};
              border-radius: 24px;
            }
            .logo { font-size: 48px; margin-bottom: 16px; }
            h1 { 
              font-size: 20px; 
              margin-bottom: 8px; 
              line-height: 1.3; 
              color: ${customization.fgColor};
              font-weight: bold;
            }
            .subtitle { 
              font-size: 16px; 
              color: ${customization.fgColor}; 
              opacity: 0.9;
              margin-bottom: 20px; 
            }
            .qr-wrapper { 
              background: white; 
              padding: 16px; 
              border-radius: 16px; 
              display: inline-block;
              margin-bottom: 20px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              position: relative;
            }
            .qr-wrapper svg {
              width: ${customization.size}px;
              height: ${customization.size}px;
              display: block;
            }
            .center-camera {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 64px;
              height: 64px;
              object-fit: contain;
              border-radius: 8px;
            }
            .instruction { 
              font-size: 12px; 
              padding: 16px;
              background: #fef3c7;
              border: 2px solid #fbbf24;
              border-radius: 12px;
              margin-bottom: 20px;
            }
            .instruction p { margin-bottom: 8px; }
            .instruction .warning { color: #92400e; font-weight: 600; }
            .instruction .hint { color: #b45309; }
            .delivery-section {
              padding: 20px;
              background: #eff6ff;
              border: 2px solid #bfdbfe;
              border-radius: 12px;
              margin-bottom: 16px;
            }
            .delivery-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-bottom: 16px;
              color: #1e40af;
              font-weight: 600;
              font-size: 14px;
            }
            .delivery-icons-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              justify-items: center;
            }
            .delivery-icon-card {
              background: white;
              border-radius: 8px;
              padding: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border: 1px solid #e2e8f0;
              width: 55px;
              height: 52px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .delivery-icon-card img {
              max-height: 40px;
              max-width: 45px;
              object-fit: contain;
            }
            @media print {
              body { padding: 0; }
              .container { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">${customization.logoText}</div>
            <h1>${customization.title}</h1>
            <p class="subtitle">${customization.subtitle}</p>
            <div class="qr-wrapper">
              ${svgData}
              <img src="${window.location.origin}/doorvii-camera.png" alt="DoorVii Camera" class="center-camera" />
            </div>
            <div class="instruction">
              <p class="warning">⚠️ Por favor, não bata ou soe a campainha física. Use a do Aplicativo.</p>
              <p class="hint">📱 Escaneie o QR Code Usando a Câmera ou um App</p>
            </div>
            ${deliveryIcons.length > 0 ? `
            <div class="delivery-section">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 12px;">
                <img src="${window.location.origin}/doorvii-logo-entregas.png" alt="DoorVii" style="height: 35px; object-fit: contain;" />
                <span style="font-size: 11px; color: #2563eb;">www.doorvii.com.br</span>
                <div class="delivery-header" style="margin-bottom: 0; margin-top: 4px;">
                  <span>📦</span>
                  <span>Entregas:</span>
                </div>
              </div>
              <div class="delivery-icons-grid">
                ${deliveryIcons.map(icon => `
                  <div class="delivery-icon-card">
                    <img src="${icon.url.startsWith('/') ? window.location.origin + icon.url : icon.url}" alt="${icon.name}" />
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          <\/script>
        </body>
        </html>
      `);
    }
    printWindow.document.close();
  };

  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Incoming Call Notification */}
      <AnimatePresence>
        {doorbellState.isRinging && (
          <IncomingCall
            callerName="Visitante"
            propertyName={doorbellState.propertyName}
            onAnswer={() => {
              dismissDoorbell();
              navigate('/dashboard');
            }}
            onDecline={dismissDoorbell}
            visitorTextMessage={doorbellState.visitorTextMessage}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">QR Code de Acesso</h1>
              <p className="text-xs text-muted-foreground">Personalize e compartilhe</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              Copiar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="order-1 lg:order-2"
          >
            <Card className="sticky top-24">
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5" />
                  Pré-visualização
                </CardTitle>
                <CardDescription>
                  Assim será exibido para impressão
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(generateCode.isPending || accessCodesLoading || !propertyAccessCode) ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                    <p className="text-muted-foreground">
                      {accessCodesLoading ? "Carregando..." : generateCode.isPending ? "Gerando QR Code..." : "Aguarde..."}
                    </p>
                  </div>
                ) : selectedModel === "classic" ? (
                  <div 
                    className="rounded-2xl p-6 text-center transition-all duration-300"
                    style={{ backgroundColor: customization.bgColor }}
                  >
                    <div className="text-4xl mb-2">{customization.logoText}</div>
                    <p className="font-bold text-xl mb-1" style={{ color: customization.fgColor }}>
                      {customization.title}
                    </p>
                    <p className="text-sm mb-4 opacity-70" style={{ color: customization.fgColor }}>
                      {customization.subtitle}
                    </p>
                    
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-lg relative" ref={qrRef}>
                      <QRCodeSVG
                        value={visitorUrl}
                        size={customization.size}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                        includeMargin={false}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white p-1 rounded-lg">
                          <img 
                            src="/doorvii-camera.png" 
                            alt="DoorVii Camera" 
                            className="w-14 h-14 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-800 font-medium mb-2">
                        ⚠️ Por favor, não bata ou soe a campainha física. Use a do Aplicativo.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
                        <Camera className="w-4 h-4" />
                        <span>Escaneie o QR Code Usando a Câmera ou um App</span>
                      </div>
                    </div>
                    
                    {/* Delivery Icons */}
                    {deliveryIcons.length > 0 && (
                      <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 border-2 border-blue-200 shadow-lg">
                        <div className="flex flex-col items-center gap-1 mb-4">
                          <img 
                            src="/doorvii-logo-entregas.png" 
                            alt="DoorVii" 
                            className="h-10 w-auto object-contain"
                          />
                          <p className="text-xs text-blue-600">www.doorvii.com.br</p>
                          <div className="flex items-center justify-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <p className="text-base font-semibold text-blue-800">Entregas:</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-8 flex-wrap">
                          {deliveryIcons.map((icon) => (
                            <div key={icon.id} className="bg-white rounded-xl p-3 shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
                              <img 
                                src={icon.url} 
                                alt={icon.name} 
                                className="h-14 w-auto object-contain" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="mt-2 text-xs opacity-50 flex items-center justify-center gap-1" style={{ color: customization.fgColor }}>
                      ✓ Código permanente
                    </p>
                  </div>
                ) : (
                  <div ref={qrRef}>
                    <StyledQRCodeSimple 
                      url={visitorUrl}
                      customization={simpleCustomization}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="w-5 h-5" />
                    Baixar PNG
                  </Button>
                  <Button onClick={handlePrint} variant="secondary" className="w-full" size="lg">
                    <Printer className="w-5 h-5" />
                    Imprimir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 lg:order-1 space-y-6"
          >
            {/* Property & Code Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Propriedade
                </CardTitle>
                <CardDescription>
                  Selecione a propriedade para gerar o QR Code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Propriedade</Label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma propriedade" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Modelo do QR Code
                </CardTitle>
                <CardDescription>
                  Escolha o estilo visual do seu QR Code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedModel("classic")}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedModel === "classic" 
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔔</div>
                    <div className="font-semibold">Clássico</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Com avisos, ícones de entregas e personalizações avançadas
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedModel("simple")}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedModel === "simple" 
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">📹</div>
                    <div className="font-semibold">Simples</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Design minimalista com foco em chamada de vídeo
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Customization Tabs - Only for Classic */}
            {selectedModel === "classic" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Personalização
                </CardTitle>
                <CardDescription>
                  Customize o visual do seu QR Code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text">Texto</TabsTrigger>
                    <TabsTrigger value="colors">Cores</TabsTrigger>
                    <TabsTrigger value="size">Tamanho</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Ícone/Emoji</Label>
                      <Input
                        id="logo"
                        value={customization.logoText}
                        onChange={(e) => setCustomization({ ...customization, logoText: e.target.value })}
                        placeholder="🏠"
                        maxLength={4}
                        className="text-2xl text-center"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={customization.title}
                        onChange={(e) => setCustomization({ ...customization, title: e.target.value })}
                        placeholder="Acesse pelo QR Code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtítulo</Label>
                      <Input
                        id="subtitle"
                        value={customization.subtitle}
                        onChange={(e) => setCustomization({ ...customization, subtitle: e.target.value })}
                        placeholder={selectedProperty?.name || "Nome da propriedade"}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="colors" className="mt-4">
                    <div className="space-y-4">
                      <Label>Esquema de cores</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => setCustomization({ 
                              ...customization, 
                              fgColor: preset.fg, 
                              bgColor: preset.bg 
                            })}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              customization.fgColor === preset.fg 
                                ? 'border-primary ring-2 ring-primary/20 scale-105' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            style={{ backgroundColor: preset.bg }}
                          >
                            <div 
                              className="w-6 h-6 rounded-full mx-auto mb-1"
                              style={{ backgroundColor: preset.fg }}
                            />
                            <span className="text-xs font-medium" style={{ color: preset.fg }}>
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="fgColor">Cor do QR</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="fgColor"
                              value={customization.fgColor}
                              onChange={(e) => setCustomization({ ...customization, fgColor: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={customization.fgColor}
                              onChange={(e) => setCustomization({ ...customization, fgColor: e.target.value })}
                              className="flex-1 font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bgColor">Cor de fundo</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="bgColor"
                              value={customization.bgColor}
                              onChange={(e) => setCustomization({ ...customization, bgColor: e.target.value })}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={customization.bgColor}
                              onChange={(e) => setCustomization({ ...customization, bgColor: e.target.value })}
                              className="flex-1 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="size" className="mt-4">
                    <div className="space-y-4">
                      <Label>Tamanho do QR Code</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {sizePresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => setCustomization({ ...customization, size: preset.value })}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              customization.size === preset.value 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="text-2xl font-bold">{preset.value}px</div>
                            <div className="text-sm text-muted-foreground">{preset.name}</div>
                          </button>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Label htmlFor="customSize">Tamanho personalizado (px)</Label>
                        <Input
                          id="customSize"
                          type="number"
                          min={100}
                          max={500}
                          value={customization.size}
                          onChange={(e) => setCustomization({ ...customization, size: Number(e.target.value) })}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            ) : (
            /* Simple Model Customization */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Personalização
                </CardTitle>
                <CardDescription>
                  Customize o visual do modelo simples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headerText">Texto superior</Label>
                  <Input
                    id="headerText"
                    value={simpleCustomization.headerText}
                    onChange={(e) => setSimpleCustomization({ ...simpleCustomization, headerText: e.target.value })}
                    placeholder="ESCANEIE PARA ME LIGAR"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footerText">Texto inferior</Label>
                  <Input
                    id="footerText"
                    value={simpleCustomization.footerText}
                    onChange={(e) => setSimpleCustomization({ ...simpleCustomization, footerText: e.target.value })}
                    placeholder="CHAMADA DE VÍDEO GRATUITA"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brandText">Nome da marca</Label>
                  <Input
                    id="brandText"
                    value={simpleCustomization.brandText}
                    onChange={(e) => setSimpleCustomization({ ...simpleCustomization, brandText: e.target.value })}
                    placeholder="DoorVi"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">URL do site</Label>
                  <Input
                    id="websiteUrl"
                    value={simpleCustomization.websiteUrl}
                    onChange={(e) => setSimpleCustomization({ ...simpleCustomization, websiteUrl: e.target.value })}
                    placeholder="www.seusite.com.br"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cor principal</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={simpleCustomization.primaryColor}
                      onChange={(e) => setSimpleCustomization({ ...simpleCustomization, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={simpleCustomization.primaryColor}
                      onChange={(e) => setSimpleCustomization({ ...simpleCustomization, primaryColor: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { name: "Azul", color: "#2563eb" },
                      { name: "Verde", color: "#16a34a" },
                      { name: "Roxo", color: "#7c3aed" },
                      { name: "Vermelho", color: "#dc2626" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setSimpleCustomization({ ...simpleCustomization, primaryColor: preset.color })}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          simpleCustomization.primaryColor === preset.color 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: preset.color }}
                      >
                        <span className="text-xs font-medium text-white drop-shadow">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Tamanho do QR Code</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "Pequeno", value: 150 },
                      { name: "Médio", value: 200 },
                      { name: "Grande", value: 280 },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setSimpleCustomization({ ...simpleCustomization, qrSize: preset.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          simpleCustomization.qrSize === preset.value 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-lg font-bold">{preset.value}px</div>
                        <div className="text-xs text-muted-foreground">{preset.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Delivery Icons Management - Only for Classic */}
            {selectedModel === "classic" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Ícones de Entregas
                </CardTitle>
                <CardDescription>
                  Adicione logos de transportadoras para exibir no QR Code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Icons */}
                <div className="space-y-2">
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
                          className="h-8 w-auto object-contain" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect fill="%23ccc" width="32" height="32"/><text x="50%" y="50%" fill="%23666" text-anchor="middle" dominant-baseline="middle" font-size="10">?</text></svg>';
                          }}
                        />
                        <span className="flex-1 text-sm font-medium">{icon.name}</span>
                        <div className="flex items-center gap-1">
                          {isDefaultIcon && (
                            <span className="text-xs text-muted-foreground mr-1">Padrão</span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveDeliveryIcon(icon.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {deliveryIcons.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum ícone adicionado
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

                {/* Add New Icon */}
                {showAddIcon ? (
                  <div className="space-y-3 p-3 border rounded-lg bg-card">
                    <div className="space-y-2">
                      <Label htmlFor="iconName">Nome da transportadora</Label>
                      <Input
                        id="iconName"
                        value={newIconName}
                        onChange={(e) => setNewIconName(e.target.value)}
                        placeholder="Ex: Jadlog"
                      />
                    </div>
                      <div className="space-y-2">
                        <Label htmlFor="iconUrl">URL da imagem (logo)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="iconUrl"
                            value={newIconUrl}
                            onChange={(e) => setNewIconUrl(e.target.value)}
                            placeholder="https://exemplo.com/logo.png"
                            className="flex-1"
                          />
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            title="Anexar arquivo"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cole o link ou anexe uma imagem PNG/JPG
                        </p>
                        {newIconUrl && newIconUrl.startsWith('data:') && (
                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                            <img src={newIconUrl} alt="Preview" className="h-8 w-auto object-contain" />
                            <span className="text-xs text-muted-foreground">Imagem anexada</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAddDeliveryIcon} 
                          className="flex-1"
                          size="sm"
                        >
                          <Check className="w-4 h-4" />
                          Adicionar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setShowAddIcon(false);
                            setNewIconName("");
                            setNewIconUrl("");
                          }}
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowAddIcon(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar transportadora
                  </Button>
                )}
              </CardContent>
            </Card>
            )}

            {/* Tips Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 rounded-full p-2">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Dica de uso</h4>
                    <p className="text-sm text-muted-foreground">
                      Imprima o QR Code e cole na entrada da sua propriedade. 
                      O visitante só precisa apontar a câmera do celular para escanear - 
                      não é necessário instalar nenhum aplicativo.
                    </p>
                    <p className="text-sm text-primary mt-2 font-medium">
                      Se desejar a etiqueta pronta em acrílico ou adesivo, contrate-nos pelo WhatsApp.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default QRCodePage;
