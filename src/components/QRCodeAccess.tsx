import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRCodeAccessProps {
  accessCode: string;
  expiresIn?: string;
  propertyName: string;
}

export const QRCodeAccess = ({
  accessCode,
  expiresIn = "24 horas",
  propertyName,
}: QRCodeAccessProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(accessCode);
    toast({
      title: "Código copiado!",
      description: "O código de acesso foi copiado para a área de transferência.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Acesso para ${propertyName}`,
        text: `Use este código para acessar: ${accessCode}`,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-6 text-center"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h3 className="font-semibold text-lg mb-1">Acesso para Visitantes</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Compartilhe este QR Code com seus visitantes
      </p>

      {/* QR Code Container */}
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative bg-foreground p-4 rounded-2xl inline-block"
        >
          <QRCodeSVG
            value={accessCode}
            size={180}
            bgColor="hsl(210 40% 98%)"
            fgColor="hsl(222 47% 6%)"
            level="H"
            includeMargin={false}
          />
        </motion.div>
      </div>

      {/* Access Code */}
      <div className="mt-6 mb-4">
        <p className="text-xs text-muted-foreground mb-2">Código de acesso</p>
        <p className="font-mono text-xl font-bold text-primary tracking-wider">
          {accessCode}
        </p>
      </div>

      {/* Expiration */}
      <p className="text-xs text-muted-foreground mb-6">
        Expira em <span className="text-accent font-medium">{expiresIn}</span>
      </p>

      {/* Actions */}
      <div className="flex gap-2 justify-center">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          <Copy className="w-4 h-4" />
          Copiar
        </Button>
        <Button variant="secondary" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
