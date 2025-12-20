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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4 overflow-y-auto"
      onClick={() => isActive && setShowControls(true)}
    >
      <div className="w-full max-w-sm my-auto min-h-fit">
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
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="relative glass rounded-3xl p-6 sm:p-8 text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Video Preview / Avatar */}
          <motion.div
            animate={!isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: isActive ? 0 : Infinity, duration: 2 }}
            className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6"
          >
            <div className={`absolute inset-0 rounded-full blur-2xl transition-colors ${isActive ? 'bg-success/30' : 'bg-primary/30'}`} />
            
            {isVideoOff && isActive ? (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-secondary flex items-center justify-center border-4 border-muted">
                <VideoOff className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={callerName}
                className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}
              />
            ) : (
              <div className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-secondary flex items-center justify-center border-4 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}>
                <Video className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
            )}
            
            {/* Online indicator */}
            <motion.span 
              className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-card ${isActive ? 'bg-success' : 'bg-warning'}`}
              animate={isActive ? {} : { scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </motion.div>

          {/* Call Status */}
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-1 text-success">Chamada em andamento</h2>
                <motion.p 
                  className="text-3xl font-mono font-bold text-foreground mb-1"
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
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Chamada recebida</h2>
                <motion.p 
                  className="text-sm text-muted-foreground mb-1"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Tocando...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="text-muted-foreground mb-1 text-sm sm:text-base">{callerName}</p>
          <p className="text-xs sm:text-sm text-primary font-medium mb-6 sm:mb-8">{propertyName}</p>

          {/* Call Controls */}
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showControls ? 1 : 0.3, y: 0 }}
                className="space-y-4"
              >
                {/* Main controls */}
                <div className="flex justify-center gap-2 sm:gap-3">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="glass"
                      size="iconLg"
                      onClick={() => setIsMuted(!isMuted)}
                      className={isMuted ? "bg-destructive/20 text-destructive border-destructive/30" : ""}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="glass"
                      size="iconLg"
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className={isVideoOff ? "bg-destructive/20 text-destructive border-destructive/30" : ""}
                    >
                      {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="glass"
                      size="iconLg"
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      className={!isSpeakerOn ? "bg-warning/20 text-warning border-warning/30" : ""}
                    >
                      {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </Button>
                  </motion.div>
                </div>

                {/* End call button */}
                <div className="flex justify-center">
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="endCall"
                      size="iconXl"
                      onClick={onDecline}
                    >
                      <PhoneOff className="w-7 h-7" />
                    </Button>
                  </motion.div>
                </div>

                {/* Status indicators */}
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  {isMuted && <span className="flex items-center gap-1"><MicOff className="w-3 h-3" /> Mudo</span>}
                  {isVideoOff && <span className="flex items-center gap-1"><VideoOff className="w-3 h-3" /> Vídeo desligado</span>}
                  {!isSpeakerOn && <span className="flex items-center gap-1"><VolumeX className="w-3 h-3" /> Alto-falante desligado</span>}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="incoming-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-center gap-4 sm:gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.95 }}
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                >
                  <Button variant="endCall" size="iconXl" onClick={onDecline}>
                    <PhoneOff className="w-7 h-7" />
                  </Button>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Button variant="call" size="iconXl" onClick={onAnswer}>
                    <Phone className="w-7 h-7" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isActive && (
            <motion.p 
              className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Deslize ou toque para atender
            </motion.p>
          )}

          {isActive && (
            <p className="text-xs text-muted-foreground mt-4">
              Toque na tela para mostrar controles
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
