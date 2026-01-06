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
  iconSize: 'small' | 'medium' | 'large';
}

export interface DeliveryIcon {
  id: string;
  name: string;
  url: string;
}

export const defaultCustomization: QRCustomization = {
  title: "ESCANEIE O QR CODE",
  subtitle: "PARA ENTRAR EM CONTATO",
  fgColor: "#ffffff",
  bgColor: "#2563eb",
  logoText: "🔔",
  size: 200,
  iconSize: 'medium',
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
        <div className={`${compact ? 'text-3xl mb-1' : 'text-5xl mb-2'}`}>
          {customization.logoText}
        </div>
        <p 
          className={`font-bold ${compact ? 'text-xs' : 'text-sm'} mb-2 tracking-wide`}
          style={{ color: customization.fgColor }}
        >
          CAMPAINHA VIRTUAL
        </p>

        {/* Title */}
        <h2 
          className={`font-bold ${compact ? 'text-sm' : 'text-lg'} leading-tight mb-1`}
          style={{ color: customization.fgColor }}
        >
          {customization.title}
        </h2>
        <p 
          className={`${compact ? 'text-xs' : 'text-sm'} mb-4`}
          style={{ color: customization.fgColor, opacity: 0.9 }}
        >
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
          <div className="bg-gradient-to-br from-blue-50 to-slate-100 border-2 border-blue-200 rounded-xl p-3 mb-4 shadow-md overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-blue-800 font-semibold text-sm mb-3">
              <span>📦</span>
              <span>Entregas:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {deliveryIcons.map((icon) => {
                const heightClasses = {
                  small: 'h-8',
                  medium: 'h-12',
                  large: 'h-16',
                };
                const paddingClasses = {
                  small: 'p-2',
                  medium: 'p-2.5',
                  large: 'p-3',
                };
                return (
                  <div 
                    key={icon.id}
                    className={`bg-white rounded-lg ${paddingClasses[customization.iconSize]} shadow-md border border-slate-200 flex items-center justify-center`}
                  >
                    <img 
                      src={icon.url.startsWith('/') ? icon.url : icon.url} 
                      alt={icon.name}
                      className={`${heightClasses[customization.iconSize]} w-auto object-contain`}
                      style={{ imageRendering: 'auto' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Security Notice */}
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-red-700 flex items-center justify-center gap-1">
            📹 SORRIA, VOCÊ ESTÁ SENDO FILMADO
          </p>
        </div>
      </div>
    </div>
  );
});

StyledQRCode.displayName = "StyledQRCode";
