import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";
import doorviiLogo from "@/assets/doorvii-logo.png";

export interface QRSimpleCustomization {
  headerText: string;
  footerText: string;
  brandText: string;
  websiteUrl: string;
  primaryColor: string;
  qrSize: number;
}

export const defaultSimpleCustomization: QRSimpleCustomization = {
  headerText: "ESCANEIE PARA ME LIGAR",
  footerText: "CHAMADA DE VÍDEO GRATUITA",
  brandText: "DoorVi",
  websiteUrl: "www.doorvi.com.br",
  primaryColor: "#2563eb",
  qrSize: 200,
};

interface StyledQRCodeSimpleProps {
  url: string;
  customization?: QRSimpleCustomization;
  className?: string;
}

export const StyledQRCodeSimple = forwardRef<HTMLDivElement, StyledQRCodeSimpleProps>(({
  url,
  customization = defaultSimpleCustomization,
  className = "",
}, ref) => {
  return (
    <div ref={ref} className={`flex flex-col items-center ${className}`}>
      {/* Main Card */}
      <div 
        className="rounded-2xl p-6 text-center w-full max-w-sm shadow-lg"
        style={{ backgroundColor: customization.primaryColor }}
      >
        {/* Header Text */}
        <h2 className="text-white font-bold text-xl sm:text-2xl leading-tight mb-6 tracking-wide drop-shadow-md">
          {customization.headerText}
        </h2>

        {/* QR Code Container */}
        <div className="bg-gray-100 rounded-2xl p-4 mx-auto inline-block shadow-inner">
          <div className="relative">
            <QRCodeSVG
              value={url}
              size={customization.qrSize}
              bgColor="#f3f4f6"
              fgColor="#1f2937"
              level="H"
              includeMargin={false}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-lg p-1.5 shadow-lg">
                <img 
                  src={doorviiLogo} 
                  alt="DoorVii" 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-white font-bold text-lg mt-6 tracking-wide drop-shadow-md">
          {customization.footerText}
        </p>

        {/* Brand Logo */}
        <div className="flex items-center justify-center mt-4">
          <img 
            src={doorviiLogo} 
            alt="DoorVii" 
            className="h-10 object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        {/* Website URL */}
        <p className="text-white/80 text-sm mt-2 font-medium">
          {customization.websiteUrl}
        </p>
      </div>
    </div>
  );
});

StyledQRCodeSimple.displayName = "StyledQRCodeSimple";
