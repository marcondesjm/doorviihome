import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";
import doorviiLogo from "@/assets/doorvii-logo.png";
import doorviiBrandLogo from "@/assets/doorvii-logo-nobg.png";
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
  websiteUrl: "www.doorvii.com.br",
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
        {/* Header Text */}
        <div className="pt-4 pb-2 px-4">
          <h2 className="font-bold text-base uppercase tracking-wider leading-tight text-center text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5), 2px 2px 4px rgba(0,0,0,0.5)' }}>
            {customization.headerText}
          </h2>
        </div>

        {/* QR Code Container - Centered with decorative cut */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="relative">
            {/* Decorative cut at the top */}
            <div 
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 rounded-b-full"
              style={{ backgroundColor: customization.primaryColor }}
            />
            <div className="bg-white rounded-xl p-3 inline-block shadow-lg">
              <div className="relative">
                <QRCodeSVG value={url} size={150} bgColor="#ffffff" fgColor="#1f2937" level="H" includeMargin={false} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-md p-1 shadow-lg">
                    <img src={doorviiLogo} alt="DoorVii" className="w-10 h-10 object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="px-4 pb-2">
          <p className="text-white font-bold text-sm uppercase tracking-wide leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            {customization.footerText}
          </p>
        </div>

        {/* Brand Logo with white background */}
        <div className="flex items-center justify-center px-4 pb-2">
          <div className="bg-white rounded-lg px-4 py-2 shadow-md">
            <img src={doorviiBrandLogo} alt="DoorVii" className="h-8 object-contain" />
          </div>
        </div>

        {/* Website URL */}
        <div className="pb-4 px-4">
          <p className="text-white text-sm font-semibold tracking-wide" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
            {customization.websiteUrl}
          </p>
        </div>
      </div>
    </div>;
});
StyledQRCodeSimple.displayName = "StyledQRCodeSimple";