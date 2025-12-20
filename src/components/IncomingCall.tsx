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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={() => isActive && setShowControls(true)}
    >
      {/* Pulse Rings - Only when ringing */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div 
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
          />
        </div>
      )}

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-xs glass rounded-3xl p-6 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Avatar */}
        <motion.div
          animate={!isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isActive ? 0 : Infinity, duration: 2 }}
          className="relative w-20 h-20 mx-auto mb-4"
        >
          {isVideoOff && isActive ? (
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 border-muted">
              <VideoOff className="w-8 h-8 text-muted-foreground" />
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={callerName}
              className={`w-20 h-20 rounded-full object-cover border-4 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}
            />
          ) : (
            <div className={`w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}>
              <Video className="w-8 h-8 text-primary" />
            </div>
          )}
          
          {/* Online indicator */}
          <motion.span 
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card ${isActive ? 'bg-success' : 'bg-warning'}`}
            animate={isActive ? {} : { scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6"
            >
              <h2 className="text-lg font-bold text-success mb-1">Chamada em andamento</h2>
              <motion.p 
                className="text-2xl font-mono font-bold text-foreground"
                key={callDuration}
              >
                {formatDuration(callDuration)}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="ringing"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6"
            >
              <h2 className="text-xl font-bold mb-1">Campainha tocando!</h2>
              <motion.p 
                className="text-sm text-muted-foreground"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {propertyName}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {isActive ? (
            <>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full ${isMuted ? "bg-destructive/20 text-destructive border-destructive/30" : ""}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="endCall"
                  size="icon"
                  onClick={onDecline}
                  className="w-14 h-14 rounded-full"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-12 h-12 rounded-full ${!isSpeakerOn ? "bg-warning/20 text-warning border-warning/30" : ""}`}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                whileTap={{ scale: 0.95 }}
                animate={{ x: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
              >
                <Button 
                  variant="endCall" 
                  size="icon" 
                  onClick={onDecline}
                  className="w-14 h-14 rounded-full"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </motion.div>
              <motion.div 
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Button 
                  variant="call" 
                  size="icon" 
                  onClick={onAnswer}
                  className="w-14 h-14 rounded-full"
                >
                  <Phone className="w-6 h-6" />
                </Button>
              </motion.div>
            </>
          )}
        </div>

        {!isActive && (
          <motion.p 
            className="text-xs text-muted-foreground mt-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Toque para atender ou recusar
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};
