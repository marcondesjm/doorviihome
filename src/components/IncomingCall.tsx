import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Mic, MicOff, Volume2, VolumeX, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface IncomingCallProps {
  callerName: string;
  propertyName: string;
  imageUrl?: string;
  onAnswer: () => void;
  onDecline: () => void;
  isActive?: boolean;
  callDuration?: number;
  formatDuration?: (seconds: number) => string;
}

export const IncomingCall = ({
  callerName,
  propertyName,
  imageUrl,
  onAnswer,
  onDecline,
  isActive = false,
  callDuration = 0,
  formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`,
}: IncomingCallProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 5 seconds during active call
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setShowControls(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, showControls]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      onClick={() => isActive && setShowControls(true)}
    >
      <div className="w-full max-w-sm">
        {/* Pulse Rings - Only when ringing */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              className="absolute w-64 h-64 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute w-64 h-64 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div 
              className="absolute w-64 h-64 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
        )}

        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="relative glass rounded-2xl p-4 flex items-center gap-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Compact Avatar */}
          <motion.div
            animate={!isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: isActive ? 0 : Infinity, duration: 2 }}
            className="relative w-14 h-14 flex-shrink-0"
          >
            {isVideoOff && isActive ? (
              <div className="relative w-14 h-14 rounded-full bg-secondary flex items-center justify-center border-2 border-muted">
                <VideoOff className="w-6 h-6 text-muted-foreground" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={callerName}
                className={`relative w-14 h-14 rounded-full object-cover border-2 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}
              />
            ) : (
              <div className={`relative w-14 h-14 rounded-full bg-secondary flex items-center justify-center border-2 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}>
                <Video className="w-6 h-6 text-primary" />
              </div>
            )}
            
            {/* Online indicator */}
            <motion.span 
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${isActive ? 'bg-success' : 'bg-warning'}`}
              animate={isActive ? {} : { scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0 text-left">

            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-base font-bold text-success truncate">Chamada em andamento</h2>
                  <motion.p 
                    className="text-lg font-mono font-bold text-foreground"
                    key={callDuration}
                  >
                    {formatDuration(callDuration)}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key="ringing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-base font-bold truncate">Campainha tocando!</h2>
                  <motion.p 
                    className="text-xs text-muted-foreground"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    {propertyName}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}

          <div className="flex items-center gap-2 flex-shrink-0">
            {isActive ? (
              <>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="glass"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className={isMuted ? "bg-destructive/20 text-destructive border-destructive/30" : ""}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="endCall"
                    size="icon"
                    onClick={onDecline}
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </motion.div>
              </>
            ) : (
              <motion.div 
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Button variant="call" size="default" onClick={onAnswer} className="px-6">
                  <Phone className="w-4 h-4 mr-2" />
                  Atender
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
