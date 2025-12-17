import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2, Video, X, Phone, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoCallQRCodeProps {
  roomName: string;
  propertyName: string;
  onClose: () => void;
  onStartCall?: () => void;
  visitorJoined?: boolean;
  meetLink?: string | null;
}

export const VideoCallQRCode = ({
  roomName,
  propertyName,
  onClose,
  onStartCall,
  visitorJoined = false,
  meetLink,
}: VideoCallQRCodeProps) => {
  const { toast } = useToast();

  // Always use our app URL, but include meet link as parameter if available
  const baseUrl = `${window.location.origin}/call/${encodeURIComponent(roomName)}?property=${encodeURIComponent(propertyName)}`;
  const callUrl = meetLink ? `${baseUrl}&meet=${encodeURIComponent(meetLink)}` : baseUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(callUrl);
    toast({
      title: "Link copiado!",
      description: "O link da chamada foi copiado para a área de transferência.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Chamada de vídeo - ${propertyName}`,
        text: `Entre na chamada de vídeo para ${propertyName}`,
        url: callUrl,
      });
    } else {
      handleCopy();
    }
  };

  const handleStartCall = () => {
    if (onStartCall) {
      onStartCall();
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass rounded-3xl p-6 text-center max-w-sm w-full relative"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Chamada de Vídeo</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Escaneie o QR Code no celular do visitante para iniciar a chamada
        </p>

        {/* QR Code Container */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.2)",
                "0 0 40px hsl(var(--primary) / 0.4)",
                "0 0 20px hsl(var(--primary) / 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative bg-white p-4 rounded-2xl inline-block"
          >
            <QRCodeSVG
              value={callUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={false}
            />
          </motion.div>
        </div>

        {/* Property name */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Propriedade</p>
          <p className="font-medium text-primary">{propertyName}</p>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full ${visitorJoined ? 'bg-success/20' : 'bg-warning/20'}`}>
          {visitorJoined ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">Visitante conectado!</span>
            </>
          ) : (
            <>
              <motion.span 
                className="w-2 h-2 rounded-full bg-warning"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="text-sm text-warning">Aguardando visitante...</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              Copiar Link
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </div>
          
          <Button 
            variant={visitorJoined ? "call" : "secondary"} 
            className="w-full" 
            onClick={handleStartCall}
          >
            <Phone className="w-4 h-4" />
            {visitorJoined ? "Entrar agora - Visitante aguardando!" : "Entrar na chamada"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Clique em "Entrar na chamada" para iniciar a videochamada do seu lado
        </p>
      </motion.div>
    </motion.div>
  );
};
