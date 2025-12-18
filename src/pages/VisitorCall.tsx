import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, ExternalLink, Copy, Check, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const VisitorCall = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const propertyName = searchParams.get('property') || 'Propriedade';
  const meetLink = searchParams.get('meet');
  
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);
  const [ringingDoorbell, setRingingDoorbell] = useState(false);

  // Notify owner when visitor scans QR code (page loads)
  useEffect(() => {
    if (!roomName || !meetLink || notified) return;

    const notifyOwner = async () => {
      try {
        // Update the call to indicate visitor has scanned the QR code
        const { error } = await supabase
          .from('video_calls')
          .update({
            visitor_joined: true,
            status: 'pending',
          })
          .eq('room_name', roomName);

        if (error) {
          console.log('Could not notify owner:', error);
        } else {
          console.log('Owner notified - visitor scanned QR code');
          setNotified(true);
        }
      } catch (err) {
        console.error('Error notifying owner:', err);
      }
    };

    notifyOwner();
  }, [roomName, meetLink, notified]);

  const handleJoinCall = () => {
    if (meetLink) {
      const decodedLink = decodeURIComponent(meetLink);
      console.log('Redirecting to Google Meet:', decodedLink);
      // Use location.href instead of window.open to avoid popup blockers on mobile
      window.location.href = decodedLink;
    } else {
      toast.error('Link da reunião não disponível');
    }
  };

  const handleCopyLink = async () => {
    if (meetLink) {
      try {
        await navigator.clipboard.writeText(decodeURIComponent(meetLink));
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Erro ao copiar link');
      }
    }
  };

  const handleRingDoorbell = async () => {
    if (!roomName || ringingDoorbell) return;
    
    setRingingDoorbell(true);
    
    try {
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'doorbell_ringing',
        })
        .eq('room_name', roomName);

      if (error) {
        console.error('Error ringing doorbell:', error);
        toast.error('Erro ao tocar campainha');
        setRingingDoorbell(false);
      } else {
        toast.success('Campainha tocando! Aguarde o morador atender...');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao tocar campainha');
      setRingingDoorbell(false);
    }
  };

  // If there's a meet link, show the Google Meet page
  if (meetLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Animated rings */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative w-32 h-32 rounded-full bg-primary/10 border-4 border-primary/50 flex items-center justify-center">
                <Video className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-2">Chamada de vídeo</h1>
            <p className="text-primary font-medium mb-4">{decodeURIComponent(propertyName)}</p>

            {/* Instrução destacada */}
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-amber-500">Primeiro passo</span>
              </div>
              <p className="text-sm text-foreground">
                Toque a campainha para avisar o morador que você chegou!
              </p>
            </div>

            <div className="space-y-3">
              {/* Botão de campainha em destaque */}
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                animate={!ringingDoorbell ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Button
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-lg py-6"
                  onClick={handleRingDoorbell}
                  disabled={ringingDoorbell}
                >
                  <Bell className={`w-6 h-6 ${ringingDoorbell ? 'animate-bounce' : ''}`} />
                  {ringingDoorbell ? '🔔 Campainha tocando...' : '🔔 Tocar Campainha'}
                </Button>
              </motion.div>

              {ringingDoorbell && (
                <p className="text-sm text-amber-500 font-medium">
                  ✓ Aguarde o morador atender...
                </p>
              )}

              <div className="border-t border-border my-4 pt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Após o morador atender, entre na chamada:
                </p>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="call"
                    size="lg"
                    className="w-full"
                    onClick={handleJoinCall}
                  >
                    <ExternalLink className="w-5 h-5" />
                    Entrar na chamada
                  </Button>
                </motion.div>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              O link abrirá o Google Meet em uma nova aba
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback for old links without meet parameter
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-muted/20 blur-2xl rounded-full" />
            <div className="relative w-32 h-32 rounded-full bg-muted/10 border-4 border-muted/50 flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Link inválido</h1>
          <p className="text-muted-foreground mb-4">
            Este link de chamada não é válido ou expirou.
          </p>
          <p className="text-sm text-muted-foreground">
            Peça um novo QR code ao morador.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VisitorCall;
