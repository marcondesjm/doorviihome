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
        className="rounded-2xl overflow-hidden text-center shadow-lg"
        style={{ 
          backgroundColor: customization.primaryColor,
          width: '7cm',
          height: '11cm',
        }}
      >
        {/* Attention Banner */}
        <div className="bg-[#0d1b4a] py-3 px-4">
          <h2 className="text-white font-bold text-lg sm:text-xl uppercase tracking-wider">
            {customization.headerText}
          </h2>
          <p className="text-white/90 text-sm uppercase tracking-wide mt-1">
            ENTRAR EM CONTATO
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6">
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
                <div className="bg-white rounded-md p-1 shadow-lg">
                  <img 
                    src={doorviiLogo} 
                    alt="DoorVii" 
                    className="w-14 h-14 object-contain"
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
          <div className="flex items-center justify-center mt-4 bg-white rounded-lg px-4 py-2 mx-auto w-fit">
            <img 
              src={doorviiLogoFull} 
              alt="DoorVii" 
              className="h-10 object-contain"
            />
          </div>

          {/* Website URL */}
          <p className="text-white/80 text-sm mt-2 font-medium">
            {customization.websiteUrl}
          </p>
        </div>
      </div>
    </div>
  );
});

StyledQRCodeSimple.displayName = "StyledQRCodeSimple";
