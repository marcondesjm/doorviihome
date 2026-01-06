import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";
import doorviiLogo from "@/assets/doorvii-logo.png";
import doorviiLogoFull from "@/assets/doorvii-logo-full.png";

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
      {/* Main Card - Fixed size 7cm x 11cm for printing */}
      <div 
        className="rounded-2xl overflow-hidden text-center shadow-lg flex flex-col"
        style={{ 
          backgroundColor: customization.primaryColor,
          width: '7cm',
          height: '11cm',
        }}
      >
        {/* Attention Banner */}
        <div className="bg-[#0d1b4a] py-2 px-3">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider leading-tight">
            {customization.headerText}
          </h2>
          <p className="text-white/90 text-xs uppercase tracking-wide mt-0.5">
            ENTRAR EM CONTATO
          </p>
        </div>

        {/* Content Area */}
        <div className="p-3 flex flex-col items-center justify-between flex-1">
          {/* QR Code Container */}
          <div className="bg-gray-100 rounded-xl p-2 inline-block shadow-inner">
            <div className="relative">
              <QRCodeSVG
                value={url}
                size={140}
                bgColor="#f3f4f6"
                fgColor="#1f2937"
                level="H"
                includeMargin={false}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-md p-0.5 shadow-lg">
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
          <p className="text-white font-bold text-sm mt-2 tracking-wide drop-shadow-md leading-tight">
            {customization.footerText}
          </p>

          {/* Brand Logo */}
          <div className="flex items-center justify-center mt-2 bg-white rounded-lg px-3 py-1.5 mx-auto w-fit">
            <img 
              src={doorviiLogoFull} 
              alt="DoorVii" 
              className="h-7 object-contain"
            />
          </div>

          {/* Website URL */}
          <p className="text-white/80 text-xs mt-1 font-medium">
            {customization.websiteUrl}
          </p>
        </div>
      </div>
    </div>
  );
});

StyledQRCodeSimple.displayName = "StyledQRCodeSimple";
