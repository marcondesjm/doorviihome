import { useState, useRef, useEffect } from "react";
import doorviiLogo from "@/assets/doorvii-logo.png";
import doorviiLogoFull from "@/assets/doorvii-logo-full.png";
import doorviiBrandLogo from "@/assets/doorvii-logo-nobg.png";
import doorviiLogoWhite from "@/assets/doorvii-logo-white.png";
import jsPDF from "jspdf";
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
  ChevronDown,
  FileText
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
  customLogoUrl: string;
  customLogoSize: number;
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
  
  // Load saved customization from localStorage
  const [customization, setCustomization] = useState<QRCustomization>(() => {
    const saved = localStorage.getItem('qrCodeCustomization');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          title: "ESCANEIE O QR CODE PARA ENTRAR EM CONTATO",
          subtitle: selectedProperty?.name || "Minha Propriedade",
          fgColor: "#ffffff",
          bgColor: "#2563eb",
          logoText: "🔔",
          size: 200,
          customLogoUrl: "",
          customLogoSize: 50,
        };
      }
    }
    return {
      title: "ESCANEIE O QR CODE PARA ENTRAR EM CONTATO",
      subtitle: selectedProperty?.name || "Minha Propriedade",
      fgColor: "#ffffff",
      bgColor: "#2563eb",
      logoText: "🔔",
      size: 200,
      customLogoUrl: "",
      customLogoSize: 50,
    };
  });

  const [newIconName, setNewIconName] = useState("");
  const [newIconUrl, setNewIconUrl] = useState("");
  const [showAddIcon, setShowAddIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  
  // Load saved simple customization from localStorage
  const [simpleCustomization, setSimpleCustomization] = useState<QRSimpleCustomization>(() => {
    const saved = localStorage.getItem('qrCodeSimpleCustomization');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          ...defaultSimpleCustomization,
          websiteUrl: window.location.origin.replace('https://', '').replace('http://', ''),
        };
      }
    }
    return {
      ...defaultSimpleCustomization,
      websiteUrl: window.location.origin.replace('https://', '').replace('http://', ''),
    };
  });
  const simpleLogoFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved selected model from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('qrCodeSelectedModel');
    if (savedModel === 'classic' || savedModel === 'simple') {
      setSelectedModel(savedModel);
    }
  }, []);

  // Save customization to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('qrCodeCustomization', JSON.stringify(customization));
  }, [customization]);

  // Save simple customization to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('qrCodeSimpleCustomization', JSON.stringify(simpleCustomization));
  }, [simpleCustomization]);

  // Save selected model to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('qrCodeSelectedModel', selectedModel);
  }, [selectedModel]);
  
  const handleSimpleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setSimpleCustomization({ ...simpleCustomization, customLogoUrl: reader.result as string });
        toast({
          title: "Logo carregada!",
          description: "A logo foi adicionada ao QR Code",
        });
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setCustomization({ ...customization, customLogoUrl: reader.result as string });
        toast({
          title: "Logo carregada!",
          description: "A logo foi adicionada ao QR Code",
        });
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
        const scale = 2; // Higher resolution
        const cardWidth = 265 * scale;
        const cardHeight = 416 * scale;
        const borderRadius = 24 * scale;
        const qrSize = 150 * scale;
        
        canvas.width = cardWidth;
        canvas.height = cardHeight;
        
        img.onload = async () => {
          if (!ctx) return;
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw rounded rectangle background
          ctx.fillStyle = simpleCustomization.primaryColor;
          ctx.beginPath();
          ctx.roundRect(0, 0, cardWidth, cardHeight, borderRadius);
          ctx.fill();
          
          // Layout calculations - properly distributed within card
          const padding = 16 * scale;
          const headerY = 48 * scale;
          const qrContainerSize = qrSize + 24 * scale;
          const qrContainerX = (cardWidth - qrContainerSize) / 2;
          
          // Center QR in the available space - adjusted for larger footer
          const topSection = 50 * scale; // Header area
          const bottomSection = 120 * scale; // Footer + brand + url area (increased)
          const availableMiddle = cardHeight - topSection - bottomSection;
          const qrContainerY = topSection + (availableMiddle - qrContainerSize) / 2;
          
          // Elements below QR - properly spaced within card bounds
          const footerTextY = qrContainerY + qrContainerSize + 20 * scale;
          const brandBgWidth = 110 * scale;
          const brandBgHeight = 26 * scale;
          const brandY = footerTextY + 20 * scale;
          const urlY = brandY + brandBgHeight + 14 * scale;
          
          const maxTextWidth = cardWidth - padding * 2;

          const fitSingleLineFont = (
            text: string,
            weight: number,
            startPx: number,
            minPx: number
          ) => {
            let size = startPx;
            while (size > minPx) {
              ctx.font = `${weight} ${size}px system-ui`;
              if (ctx.measureText(text).width <= maxTextWidth) break;
              size -= 1;
            }
            return size;
          };

          // Draw header text (fit inside card) - text-xl = 20px base
          ctx.fillStyle = "#ffffff";
          const headerFontSize = fitSingleLineFont(
            simpleCustomization.headerText,
            900,
            20 * scale,
            12 * scale
          );
          ctx.font = `900 ${headerFontSize}px system-ui`;
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4 * scale;
          ctx.shadowOffsetX = 2 * scale;
          ctx.shadowOffsetY = 2 * scale;
          ctx.fillText(simpleCustomization.headerText, cardWidth / 2, headerY);
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
        // Draw QR code container (white background)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 12 * scale);
        ctx.fill();
        
        // Draw decorative cut at the top of QR container
        const cutWidth = 48 * scale;
        const cutHeight = 16 * scale;
        ctx.fillStyle = simpleCustomization.primaryColor;
        ctx.beginPath();
        ctx.ellipse(cardWidth / 2, qrContainerY - cutHeight / 2 + 8 * scale, cutWidth / 2, cutHeight / 2, 0, 0, Math.PI);
        ctx.fill();
        
        // Draw QR code centered
        const qrX = (cardWidth - qrSize) / 2;
        const qrY = qrContainerY + 12 * scale;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          
          // Draw logo in center of QR code
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          
          const finishDownload = () => {
            // Draw footer text (fit inside card) - text-lg = 18px base
            const footerFontSize = fitSingleLineFont(
              simpleCustomization.footerText,
              900,
              18 * scale,
              11 * scale
            );
            ctx.fillStyle = "#ffffff";
            ctx.font = `900 ${footerFontSize}px system-ui`;
            ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
            ctx.shadowBlur = 8 * scale;
            ctx.fillText(simpleCustomization.footerText, cardWidth / 2, footerTextY);
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 4 * scale;
            ctx.shadowOffsetX = 2 * scale;
            ctx.shadowOffsetY = 2 * scale;
            ctx.fillText(simpleCustomization.footerText, cardWidth / 2, footerTextY);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Shadow for brand box
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 6 * scale;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3 * scale;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect((cardWidth - brandBgWidth) / 2, brandY, brandBgWidth, brandBgHeight, 8 * scale);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw logo in brand area
            const brandLogoImg = new Image();
            brandLogoImg.crossOrigin = 'anonymous';
            brandLogoImg.onload = () => {
              const logoHeight = 18 * scale;
              const logoWidth = (brandLogoImg.width / brandLogoImg.height) * logoHeight;
              ctx.drawImage(brandLogoImg, (cardWidth - logoWidth) / 2, brandY + 4 * scale, logoWidth, logoHeight);
              
              // Draw website URL at the bottom (inside card)
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${10 * scale}px system-ui`;
              ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
              ctx.shadowBlur = 2 * scale;
              ctx.fillText(simpleCustomization.websiteUrl, cardWidth / 2, urlY);
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
              ctx.fillStyle = simpleCustomization.primaryColor;
              ctx.font = `bold ${14 * scale}px system-ui`;
              ctx.fillText('DoorVii', cardWidth / 2, brandY + 18 * scale);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${10 * scale}px system-ui`;
              ctx.fillText(simpleCustomization.websiteUrl, cardWidth / 2, urlY);
              
              const link = document.createElement('a');
              link.download = `qrcode-simples-${selectedProperty?.name?.replace(/\s+/g, '-').toLowerCase() || 'propriedade'}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
              
              toast({
                title: "QR Code baixado!",
                description: "A imagem foi salva com cantos arredondados.",
              });
            };
            brandLogoImg.src = doorviiBrandLogo;
          };
          
          logoImg.onload = () => {
            const centerLogoSize = 48 * scale;
            const centerX = cardWidth / 2 - centerLogoSize / 2;
            const centerY = qrY + qrSize / 2 - centerLogoSize / 2;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(centerX - 4 * scale, centerY - 4 * scale, centerLogoSize + 8 * scale, centerLogoSize + 8 * scale, 6 * scale);
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
        const deliveryHeight = deliveryIcons.length > 0 ? 60 + (iconRows * 75) : 0;
        const logoHeight = customization.customLogoUrl ? customization.customLogoSize : 50;
        canvas.width = Math.max(qrSize + padding * 2, 450);
        canvas.height = qrSize + 340 + deliveryHeight + logoHeight + 50;
        
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
            const sectionHeight = 50 + (iconRows * 70);
            
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
            
            ctx.fillStyle = '#1e40af';
            ctx.font = 'bold 14px system-ui';
            ctx.fillText('📦 Entregas:', canvas.width / 2, deliveryY + 25);
            
            // Load and draw delivery icons in rows
            const iconWidth = 65;
            const iconHeight = 52;
            const iconGap = 12;
            
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
                  const iconY = deliveryY + 40 + (row * 68);
                  
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
          
          // Draw logo at bottom (custom or default DoorVii)
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          let logoEndY = warningY + 90;
          await new Promise<void>((resolve) => {
            logoImg.onload = () => {
              const logoHeight = customization.customLogoUrl ? customization.customLogoSize : 50;
              const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
              const logoY = deliveryIcons.length > 0 
                ? warningY + 80 + 50 + (Math.ceil(deliveryIcons.length / 4) * 70) + 25
                : warningY + 90;
              ctx.drawImage(logoImg, (canvas.width - logoWidth) / 2, logoY, logoWidth, logoHeight);
              logoEndY = logoY + logoHeight;
              resolve();
            };
            logoImg.onerror = () => resolve();
            logoImg.src = customization.customLogoUrl || doorviiLogoWhite;
          });
          
          // Draw website URL
          ctx.fillStyle = customization.fgColor;
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('www.doorvii.com.br', canvas.width / 2, logoEndY + 25);
          
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

  const handleDownloadPDF = async () => {
    if (!qrRef.current) return;

    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (selectedModel === 'simple') {
        // Simple model PDF - Fixed size 7cm x 11cm
        const cardWidthCm = 7;
        const cardHeightCm = 11;
        const scale = 3;
        const cardWidth = 265 * scale;
        const cardHeight = 416 * scale;
        const borderRadius = 24 * scale;
        const qrSize = 150 * scale;
        
        canvas.width = cardWidth;
        canvas.height = cardHeight;
        
        img.onload = async () => {
          if (!ctx) return;
          
          ctx.clearRect(0, 0, cardWidth, cardHeight);
          ctx.fillStyle = simpleCustomization.primaryColor;
          ctx.beginPath();
          ctx.roundRect(0, 0, cardWidth, cardHeight, borderRadius);
          ctx.fill();
          
          const headerY = 48 * scale;
          const qrContainerSize = qrSize + 24 * scale;
          const qrContainerX = (cardWidth - qrContainerSize) / 2;
          const topSection = 50 * scale;
          const bottomSection = 120 * scale; // Increased for larger footer
          const availableMiddle = cardHeight - topSection - bottomSection;
          const qrContainerY = topSection + (availableMiddle - qrContainerSize) / 2;
          const footerTextY = qrContainerY + qrContainerSize + 20 * scale;
          const brandBgWidth = 110 * scale;
          const brandBgHeight = 26 * scale;
          const brandY = footerTextY + 20 * scale;
          const urlY = brandY + brandBgHeight + 14 * scale;
          
          const maxTextWidth = cardWidth - 16 * scale * 2;

          const fitSingleLineFont = (
            text: string,
            weight: number,
            startPx: number,
            minPx: number
          ) => {
            let size = startPx;
            while (size > minPx) {
              ctx.font = `${weight} ${size}px system-ui`;
              if (ctx.measureText(text).width <= maxTextWidth) break;
              size -= 1;
            }
            return size;
          };

          ctx.fillStyle = "#ffffff";
          const headerFontSize = fitSingleLineFont(
            simpleCustomization.headerText,
            900,
            20 * scale,
            12 * scale
          );
          ctx.font = `900 ${headerFontSize}px system-ui`;
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4 * scale;
          ctx.shadowOffsetX = 2 * scale;
          ctx.shadowOffsetY = 2 * scale;
          ctx.fillText(simpleCustomization.headerText, cardWidth / 2, headerY);
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 12 * scale);
          ctx.fill();
          
          const cutWidth = 48 * scale;
          const cutHeight = 16 * scale;
          ctx.fillStyle = simpleCustomization.primaryColor;
          ctx.beginPath();
          ctx.ellipse(cardWidth / 2, qrContainerY - cutHeight / 2 + 8 * scale, cutWidth / 2, cutHeight / 2, 0, 0, Math.PI);
          ctx.fill();
          
          const qrX = (cardWidth - qrSize) / 2;
          const qrY = qrContainerY + 12 * scale;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          
          const finishPDF = () => {
            // Draw footer text (fit inside card) - text-lg = 18px base
            const footerFontSize = fitSingleLineFont(
              simpleCustomization.footerText,
              900,
              18 * scale,
              11 * scale
            );
            ctx.fillStyle = "#ffffff";
            ctx.font = `900 ${footerFontSize}px system-ui`;
            ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
            ctx.shadowBlur = 8 * scale;
            ctx.fillText(simpleCustomization.footerText, cardWidth / 2, footerTextY);
            ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
            ctx.shadowBlur = 4 * scale;
            ctx.shadowOffsetX = 2 * scale;
            ctx.shadowOffsetY = 2 * scale;
            ctx.fillText(simpleCustomization.footerText, cardWidth / 2, footerTextY);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 6 * scale;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3 * scale;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect((cardWidth - brandBgWidth) / 2, brandY, brandBgWidth, brandBgHeight, 8 * scale);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            const brandLogoImg = new Image();
            brandLogoImg.crossOrigin = 'anonymous';
            brandLogoImg.onload = () => {
              const logoHeight = 18 * scale;
              const logoWidth = (brandLogoImg.width / brandLogoImg.height) * logoHeight;
              ctx.drawImage(brandLogoImg, (cardWidth - logoWidth) / 2, brandY + 4 * scale, logoWidth, logoHeight);
              
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${10 * scale}px system-ui`;
              ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
              ctx.shadowBlur = 2 * scale;
              ctx.fillText(simpleCustomization.websiteUrl, cardWidth / 2, urlY);
              ctx.shadowBlur = 0;
              
              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'cm',
                format: [cardWidthCm, cardHeightCm]
              });
              
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', 0, 0, cardWidthCm, cardHeightCm);
              pdf.save(`qrcode-simples-${selectedProperty?.name?.replace(/\s+/g, '-').toLowerCase() || 'propriedade'}.pdf`);
              
              toast({
                title: "PDF baixado!",
                description: "O arquivo PDF foi salvo no seu dispositivo.",
              });
            };
            brandLogoImg.onerror = () => {
              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'cm',
                format: [cardWidthCm, cardHeightCm]
              });
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', 0, 0, cardWidthCm, cardHeightCm);
              pdf.save(`qrcode-simples-${selectedProperty?.name?.replace(/\s+/g, '-').toLowerCase() || 'propriedade'}.pdf`);
            };
            brandLogoImg.src = doorviiBrandLogo;
          };
          
          logoImg.onload = () => {
            const centerLogoSize = 48 * scale;
            const centerX = cardWidth / 2 - centerLogoSize / 2;
            const centerY = qrY + qrSize / 2 - centerLogoSize / 2;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(centerX - 4 * scale, centerY - 4 * scale, centerLogoSize + 8 * scale, centerLogoSize + 8 * scale, 6 * scale);
            ctx.fill();
            ctx.drawImage(logoImg, centerX, centerY, centerLogoSize, centerLogoSize);
            finishPDF();
          };
          logoImg.onerror = () => {
            finishPDF();
          };
          logoImg.src = doorviiLogo;
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      } else {
        // Classic model PDF
        const padding = 40;
        const qrSize = customization.size;
        const iconsPerRow = 4;
        const iconRows = deliveryIcons.length > 0 ? Math.ceil(deliveryIcons.length / iconsPerRow) : 0;
        const deliveryHeight = deliveryIcons.length > 0 ? 120 + (iconRows * 75) : 0;
        const logoHeight = customization.customLogoUrl ? customization.customLogoSize : 50;
        canvas.width = Math.max(qrSize + padding * 2, 450);
        canvas.height = qrSize + 340 + deliveryHeight + logoHeight + 50;
        
        img.onload = async () => {
          if (!ctx) return;
          
          ctx.fillStyle = customization.bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.font = '48px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(customization.logoText, canvas.width / 2, 55);
          
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
          
          ctx.font = '16px system-ui';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(customization.subtitle, canvas.width / 2, titleY + 25);
          
          const qrContainerSize = qrSize + 32;
          const qrContainerX = (canvas.width - qrContainerSize) / 2;
          const qrContainerY = titleY + 50;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 16);
          ctx.fill();
          
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = qrContainerY + 16;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          
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
          
          if (deliveryIcons.length > 0) {
            const deliveryY = warningY + 80;
            const iconRows = Math.ceil(deliveryIcons.length / iconsPerRow);
            const sectionHeight = 50 + (iconRows * 70);
            
            ctx.fillStyle = '#eff6ff';
            ctx.beginPath();
            ctx.roundRect(padding / 2, deliveryY, canvas.width - padding, sectionHeight, 12);
            ctx.fill();
            ctx.strokeStyle = '#bfdbfe';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(padding / 2, deliveryY, canvas.width - padding, sectionHeight, 12);
            ctx.stroke();
            
            ctx.fillStyle = '#1e40af';
            ctx.font = 'bold 14px system-ui';
            ctx.fillText('📦 Entregas:', canvas.width / 2, deliveryY + 25);
            
            const iconWidth = 65;
            const iconHeight = 52;
            const iconGap = 12;
            
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
                  const iconY = deliveryY + 40 + (row * 68);
                  
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.roundRect(iconX, iconY, iconWidth, iconHeight + 8, 8);
                  ctx.fill();
                  ctx.strokeStyle = '#e2e8f0';
                  ctx.beginPath();
                  ctx.roundRect(iconX, iconY, iconWidth, iconHeight + 8, 8);
                  ctx.stroke();
                  
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
          
          // Draw logo at bottom (custom or default DoorVii)
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          let logoEndY = warningY + 90;
          await new Promise<void>((resolve) => {
            logoImg.onload = () => {
              const logoHeight = customization.customLogoUrl ? customization.customLogoSize : 50;
              const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
              const logoY = deliveryIcons.length > 0 
                ? warningY + 80 + 50 + (Math.ceil(deliveryIcons.length / iconsPerRow) * 70) + 25
                : warningY + 90;
              ctx.drawImage(logoImg, (canvas.width - logoWidth) / 2, logoY, logoWidth, logoHeight);
              logoEndY = logoY + logoHeight;
              resolve();
            };
            logoImg.onerror = () => resolve();
            logoImg.src = customization.customLogoUrl || doorviiLogoWhite;
          });
          
          // Draw website URL
          ctx.fillStyle = customization.fgColor;
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('www.doorvii.com.br', canvas.width / 2, logoEndY + 25);
          
          // Create PDF
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
          });
          
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save(`qrcode-${selectedProperty?.name?.replace(/\s+/g, '-').toLowerCase() || 'propriedade'}.pdf`);
          
          toast({
            title: "PDF baixado!",
            description: "O arquivo PDF foi salvo no seu dispositivo.",
          });
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível gerar o PDF.",
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
              padding: 0 12px;
              line-height: 1.15;
              word-break: break-word;
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
              font-size: 22px;
              font-weight: 900;
              margin-bottom: 16px;
              letter-spacing: 1px;
              text-shadow: 0 0 15px rgba(255,255,255,0.6), 2px 2px 6px rgba(0,0,0,0.6);
              padding: 0 12px;
              line-height: 1.15;
              word-break: break-word;
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
              <div class="delivery-header" style="margin-bottom: 12px;">
                <span>📦</span>
                <span>Entregas:</span>
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
            <div style="margin-top: 20px; text-align: center;">
              ${customization.customLogoUrl 
                ? `<img src="${customization.customLogoUrl}" alt="Logo" style="height: ${customization.customLogoSize}px;" />`
                : `<img src="${doorviiLogoWhite}" alt="DoorVii" style="height: 48px; filter: brightness(0) saturate(100%) invert(29%) sepia(98%) saturate(1562%) hue-rotate(212deg) brightness(97%) contrast(93%);" />`
              }
              <p style="margin-top: 8px; font-size: 14px; font-weight: 600; color: ${customization.fgColor};">www.doorvii.com.br</p>
            </div>
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
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Package className="w-5 h-5 text-blue-600" />
                          <p className="text-base font-semibold text-blue-800">Entregas:</p>
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
                    
                    {/* Logo - Custom or Default DoorVii */}
                    <div className="mt-6 flex justify-center">
                      {customization.customLogoUrl ? (
                        <img 
                          src={customization.customLogoUrl} 
                          alt="Logo personalizada" 
                          className="object-contain"
                          style={{ height: `${customization.customLogoSize}px` }}
                        />
                      ) : (
                        <img 
                          src={doorviiLogoWhite} 
                          alt="DoorVii" 
                          className="h-16 object-contain"
                          style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(98%) saturate(1562%) hue-rotate(212deg) brightness(97%) contrast(93%)' }}
                        />
                      )}
                    </div>
                    
                    {/* Website URL */}
                    <p className="mt-2 text-sm font-medium" style={{ color: customization.fgColor }}>
                      www.doorvii.com.br
                    </p>
                    
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
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <Button onClick={handleDownload} className="w-full" size="lg">
                    <Download className="w-4 h-4" />
                    PNG
                  </Button>
                  <Button onClick={handleDownloadPDF} variant="secondary" className="w-full" size="lg">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                  <Button onClick={handlePrint} variant="outline" className="w-full" size="lg">
                    <Printer className="w-4 h-4" />
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
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="text">Texto</TabsTrigger>
                    <TabsTrigger value="colors">Cores</TabsTrigger>
                    <TabsTrigger value="size">Tamanho</TabsTrigger>
                    <TabsTrigger value="logo">Logo</TabsTrigger>
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

                  <TabsContent value="logo" className="mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Logo personalizada</Label>
                        <p className="text-xs text-muted-foreground">
                          Faça upload de uma imagem para aparecer abaixo dos ícones de entrega
                        </p>
                      </div>
                      
                      {customization.customLogoUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <img 
                              src={customization.customLogoUrl} 
                              alt="Logo personalizada" 
                              className="h-12 w-auto object-contain"
                            />
                            <span className="flex-1 text-sm text-muted-foreground">Logo carregada</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setCustomization({ ...customization, customLogoUrl: "" })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Tamanho da logo</Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { name: "Pequena", value: 30 },
                                { name: "Média", value: 50 },
                                { name: "Grande", value: 70 },
                              ].map((preset) => (
                                <button
                                  key={preset.name}
                                  onClick={() => setCustomization({ ...customization, customLogoSize: preset.value })}
                                  className={`p-2 rounded-lg border-2 transition-all text-center ${
                                    customization.customLogoSize === preset.value 
                                      ? 'border-primary bg-primary/10' 
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <div className="text-sm font-medium">{preset.name}</div>
                                  <div className="text-xs text-muted-foreground">{preset.value}px</div>
                                </button>
                              ))}
                            </div>
                            
                            <div className="pt-2">
                              <Label htmlFor="customLogoSize">Tamanho personalizado (px)</Label>
                              <Input
                                id="customLogoSize"
                                type="number"
                                min={20}
                                max={100}
                                value={customization.customLogoSize}
                                onChange={(e) => setCustomization({ ...customization, customLogoSize: Number(e.target.value) })}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="file"
                            ref={logoFileInputRef}
                            onChange={handleLogoFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            className="w-full h-24 border-dashed"
                            onClick={() => logoFileInputRef.current?.click()}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-6 h-6 text-muted-foreground" />
                              <span className="text-sm">Clique para fazer upload</span>
                              <span className="text-xs text-muted-foreground">PNG, JPG ou SVG</span>
                            </div>
                          </Button>
                          
                          <p className="text-xs text-muted-foreground text-center">
                            Use a logo padrão DoorVii ou faça upload de sua própria logo
                          </p>
                        </div>
                      )}
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
                
                {/* Logo personalizada para modelo simples */}
                <div className="space-y-3 border-t pt-4">
                  <Label>Logo personalizada</Label>
                  <p className="text-xs text-muted-foreground">
                    Faça upload de uma imagem para aparecer no rodapé do QR Code
                  </p>
                  
                  {simpleCustomization.customLogoUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <img 
                          src={simpleCustomization.customLogoUrl} 
                          alt="Logo personalizada" 
                          className="h-12 w-auto object-contain"
                        />
                        <span className="flex-1 text-sm text-muted-foreground">Logo carregada</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setSimpleCustomization({ ...simpleCustomization, customLogoUrl: "" })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tamanho da logo</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { name: "Pequena", value: 30 },
                            { name: "Média", value: 50 },
                            { name: "Grande", value: 70 },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => setSimpleCustomization({ ...simpleCustomization, customLogoSize: preset.value })}
                              className={`p-2 rounded-lg border-2 transition-all text-center ${
                                simpleCustomization.customLogoSize === preset.value 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="text-sm font-medium">{preset.name}</div>
                              <div className="text-xs text-muted-foreground">{preset.value}px</div>
                            </button>
                          ))}
                        </div>
                        
                        <div className="pt-2">
                          <Label htmlFor="simpleCustomLogoSize">Tamanho personalizado (px)</Label>
                          <Input
                            id="simpleCustomLogoSize"
                            type="number"
                            min={20}
                            max={100}
                            value={simpleCustomization.customLogoSize}
                            onChange={(e) => setSimpleCustomization({ ...simpleCustomization, customLogoSize: Number(e.target.value) })}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={simpleLogoFileInputRef}
                        onChange={handleSimpleLogoFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full h-24 border-dashed"
                        onClick={() => simpleLogoFileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <span className="text-sm">Clique para fazer upload</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG ou SVG</span>
                        </div>
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        Use a logo padrão DoorVii ou faça upload de sua própria logo
                      </p>
                    </div>
                  )}
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
