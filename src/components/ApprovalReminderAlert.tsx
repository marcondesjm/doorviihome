import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApprovalReminderAlertProps {
  isVisible: boolean;
  onDismiss: () => void;
  propertyName: string;
}

export const ApprovalReminderAlert = ({
  isVisible,
  onDismiss,
  propertyName,
}: ApprovalReminderAlertProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playDoorbellSound = useCallback(() => {
    if (isMuted) return;
    
    try {
      const ctx = initAudio();
      
      // First chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 659.25; // E5
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);

      // Second chime (lower)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 523.25; // C5
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.4, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [initAudio, isMuted]);

  // Play doorbell sound repeatedly
  useEffect(() => {
    if (isVisible && !isMuted) {
      // Play immediately
      playDoorbellSound();
      
      // Then every 3 seconds
      intervalRef.current = setInterval(() => {
        playDoorbellSound();
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, isMuted, playDoorbellSound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-20 right-4 z-[60] w-[90%] max-w-md sm:right-8"
        >
          <div className="bg-amber-500 text-amber-950 rounded-2xl p-4 shadow-2xl border-2 border-amber-400">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, -15, 15, -15, 15, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity, 
                  repeatDelay: 2.5 
                }}
              >
                <Bell className="w-8 h-8" />
              </motion.div>
              
              <div className="flex-1">
                <p className="font-bold text-lg">Visitante aguardando!</p>
                <p className="text-sm opacity-90">
                  Aprove o visitante no Google Meet para {propertyName}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-amber-950 hover:bg-amber-400/50"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={onDismiss}
                className="flex-1 bg-amber-950 text-amber-100 hover:bg-amber-900"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Já aprovei o visitante
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
