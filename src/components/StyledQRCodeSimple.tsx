import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";
import doorviiLogo from "@/assets/doorvii-logo.png";
import doorviiBrandLogo from "@/assets/doorvii-brand-logo.png";
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
  qrSize: 200
};
interface StyledQRCodeSimpleProps {
  url: string;
  customization?: QRSimpleCustomization;
  className?: string;
}
export const StyledQRCodeSimple = forwardRef<HTMLDivElement, StyledQRCodeSimpleProps>(({
  url,
  customization = defaultSimpleCustomization,
  className = ""
}, ref) => {
  return <div ref={ref} className={`flex flex-col items-center ${className}`}>
      {/* Main Card - Fixed size 7cm x 11cm for printing */}
      <div className="rounded-2xl overflow-hidden text-center shadow-lg flex flex-col" style={{
      backgroundColor: customization.primaryColor,
      width: '7cm',
      height: '11cm'
    }}>
        {/* Attention Banner */}
        <div className="py-2 px-3 relative">
          <div className="absolute inset-0" style={{ backgroundColor: customization.primaryColor, filter: 'brightness(0.7)' }}></div>
          <h2 className="relative z-10 font-bold text-sm uppercase tracking-wider leading-tight text-center text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5), 2px 2px 4px rgba(0,0,0,0.5)' }}>
            {customization.headerText}
          </h2>
          <p className="relative z-10 text-white text-xs uppercase tracking-wide mt-0.5 text-center" style={{ textShadow: '0 0 8px rgba(255,255,255,0.4), 1px 1px 3px rgba(0,0,0,0.4)' }}>
            ENTRAR EM CONTATO
          </p>
        </div>

        {/* Content Area */}
        <div className="p-3 flex flex-col items-center justify-between flex-1">
          {/* QR Code Container */}
          <div className="bg-gray-100 rounded-xl p-2 inline-block shadow-inner">
            <div className="relative">
              <QRCodeSVG value={url} size={140} bgColor="#f3f4f6" fgColor="#1f2937" level="H" includeMargin={false} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-md p-0.5 shadow-lg">
                  <img src={doorviiLogo} alt="DoorVii" className="w-10 h-10 object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="w-full">
            <p className="text-white font-bold text-sm tracking-wide leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              {customization.footerText}
            </p>
            <div className="w-full h-0.5 bg-white/80 mt-2"></div>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center justify-center mt-2 bg-white rounded-lg px-4 py-2 mx-auto w-fit">
            <img src={doorviiBrandLogo} alt="DoorVii" className="h-14 object-contain" />
          </div>

          {/* Website URL */}
          <p className="text-white text-sm mt-1.5 font-semibold">
            {customization.websiteUrl}
          </p>
        </div>
      </div>
    </div>;
});
StyledQRCodeSimple.displayName = "StyledQRCodeSimple";