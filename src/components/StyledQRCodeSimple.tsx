import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";
import { Video } from "lucide-react";

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
            {/* Center Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-2 shadow-lg">
                <div className="text-white text-xs font-bold mb-0.5">DoorVii</div>
                <Video className="w-6 h-6 text-white mx-auto" />
                <div className="text-white text-[8px] font-medium mt-0.5 leading-tight">
                  CHAMADA DE<br />VIDEO
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-white font-bold text-lg mt-6 tracking-wide drop-shadow-md">
          {customization.footerText}
        </p>

        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">
            {customization.brandText}
          </span>
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
