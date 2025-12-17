import { motion } from "framer-motion";
import { Home, Bell, Video, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyCardProps {
  name: string;
  address: string;
  isOnline: boolean;
  lastActivity?: string;
  imageUrl?: string;
  onViewLive: () => void;
}

export const PropertyCard = ({
  name,
  address,
  isOnline,
  lastActivity,
  imageUrl,
  onViewLive,
}: PropertyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass rounded-2xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Preview Image */}
      <div className="relative h-40 overflow-hidden bg-secondary">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isOnline 
              ? "bg-success/20 text-success border border-success/30" 
              : "bg-muted/80 text-muted-foreground border border-border"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-success animate-pulse-soft" : "bg-muted-foreground"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="glass" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Live View Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <Button variant="default" size="sm" onClick={onViewLive} className="gap-2">
            <Video className="w-4 h-4" />
            Ver ao vivo
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{address}</p>
          </div>
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {isOnline && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
            )}
          </div>
        </div>
        
        {lastActivity && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            {lastActivity}
          </p>
        )}
      </div>
    </motion.div>
  );
};
