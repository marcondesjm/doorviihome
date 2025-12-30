import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";

export interface QRCustomization {
  title: string;
  subtitle: string;
  fgColor: string;
  bgColor: string;
  logoText: string;
  size: number;
}

export interface DeliveryIcon {
  id: string;
  name: string;
  url: string;
}

export const defaultCustomization: QRCustomization = {
  title: "ESCANEIE O QR CODE",
  subtitle: "PARA ENTRAR EM CONTATO",
  fgColor: "#1a1a2e",
  bgColor: "#f8fafc",
  logoText: "🔔",
  size: 200,
};

export const defaultDeliveryIcons: DeliveryIcon[] = [
  { id: "correios", name: "Correios", url: "/correios-logo.png" },
  { id: "aliexpress", name: "AliExpress", url: "/aliexpress-logo.jpg" },
  { id: "mercadolivre", name: "Mercado Livre", url: "/mercadolivre-logo.png" },
];

interface StyledQRCodeProps {
  url: string;
  customization?: QRCustomization;
  deliveryIcons?: DeliveryIcon[];
  showDeliveryIcons?: boolean;
  showWarning?: boolean;
  showPermanentCode?: boolean;
  compact?: boolean;
  className?: string;
}

export const StyledQRCode = forwardRef<HTMLDivElement, StyledQRCodeProps>(({
  url,
  customization = defaultCustomization,
  deliveryIcons = defaultDeliveryIcons,
  showDeliveryIcons = true,
  showWarning = true,
  showPermanentCode = true,
  compact = false,
  className = "",
}, ref) => {
  const qrSize = compact ? Math.min(customization.size, 160) : customization.size;

  return (
    <div ref={ref} className={`flex flex-col items-center ${className}`}>
      {/* Main Card */}
      <div 
        className="rounded-2xl p-4 sm:p-6 text-center w-full max-w-sm"
        style={{ backgroundColor: customization.bgColor }}
      >
        {/* Logo */}
        <div className={`${compact ? 'text-3xl mb-2' : 'text-5xl mb-3'}`}>
          {customization.logoText}
        </div>

        {/* Title */}
        <h2 
          className={`font-bold ${compact ? 'text-sm' : 'text-lg'} leading-tight mb-1`}
          style={{ color: customization.fgColor }}
        >
          {customization.title}
        </h2>
        <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground mb-4`}>
          {customization.subtitle}
        </p>

        {/* QR Code */}
        <motion.div
          animate={{ 
            boxShadow: [
              "0 0 10px rgba(0,0,0,0.1)",
              "0 0 20px rgba(0,0,0,0.15)",
              "0 0 10px rgba(0,0,0,0.1)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-white p-3 rounded-xl inline-block mb-4 border border-border/20"
        >
          <QRCodeSVG
            value={url}
            size={qrSize}
            bgColor="#ffffff"
            fgColor={customization.fgColor}
            level="H"
            includeMargin={false}
          />
        </motion.div>

        {/* Warning Box */}
        {showWarning && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 mb-4">
            <p className="text-amber-800 font-semibold text-xs mb-1">
              ⚠️ Por favor, não bata ou soe a campainha física. Use a do Aplicativo.
            </p>
            <p className="text-amber-700 text-xs">
              📱 Escaneie o QR Code Usando a Câmera ou um App
            </p>
          </div>
        )}

        {/* Delivery Icons Section */}
        {showDeliveryIcons && deliveryIcons.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-slate-100 border-2 border-blue-200 rounded-xl p-3 mb-4 shadow-md">
            <div className="flex items-center justify-center gap-2 mb-3 text-blue-800 font-semibold text-sm">
              <span>📦</span>
              <span>Entregas:</span>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(deliveryIcons.length, 4)}, minmax(0, 1fr))` }}>
              {deliveryIcons.map((icon) => (
                <div 
                  key={icon.id}
                  className="bg-white rounded-lg p-2 shadow-md border border-slate-200 flex items-center justify-center"
                >
                  <img 
                    src={icon.url.startsWith('/') ? icon.url : icon.url} 
                    alt={icon.name}
                    className={`${compact ? 'h-6 w-10' : 'h-8 w-12'} object-contain`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permanent Code Indicator */}
        {showPermanentCode && (
          <p className="text-xs text-muted-foreground">
            ✓ Código permanente
          </p>
        )}
      </div>
    </div>
  );
});

StyledQRCode.displayName = "StyledQRCode";
