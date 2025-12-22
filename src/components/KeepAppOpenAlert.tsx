import { motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useState, useEffect } from "react";

export const KeepAppOpenAlert = () => {
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before (lasts 24 hours)
    const dismissedAt = localStorage.getItem('keepAppOpenDismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      const now = Date.now();
      // Show again after 24 hours
      if (now - dismissedTime < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }
    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('keepAppOpenDismissed', Date.now().toString());
  };

  if (dismissed || !show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-16 left-4 right-4 z-40 max-w-md mx-auto"
    >
      <div className="relative bg-warning/10 border border-warning/30 rounded-xl p-3 pr-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Mantenha o app aberto
            </p>
            <p className="text-xs text-muted-foreground">
              Para receber chamadas da campainha, não feche este aplicativo
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
};
