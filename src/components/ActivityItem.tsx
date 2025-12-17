import { motion } from "framer-motion";
import { Phone, PhoneOff, PhoneIncoming, Bell, Clock } from "lucide-react";

type ActivityType = "incoming" | "answered" | "missed" | "doorbell";

interface ActivityItemProps {
  type: ActivityType;
  title: string;
  property: string;
  time: string;
  duration?: string;
}

const iconMap = {
  incoming: PhoneIncoming,
  answered: Phone,
  missed: PhoneOff,
  doorbell: Bell,
};

const colorMap = {
  incoming: "text-primary bg-primary/10",
  answered: "text-success bg-success/10",
  missed: "text-destructive bg-destructive/10",
  doorbell: "text-accent bg-accent/10",
};

export const ActivityItem = ({
  type,
  title,
  property,
  time,
  duration,
}: ActivityItemProps) => {
  const Icon = iconMap[type];
  const colorClass = colorMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
    >
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{property}</p>
      </div>

      <div className="text-right">
        <p className="text-sm text-muted-foreground">{time}</p>
        {duration && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {duration}
          </p>
        )}
      </div>
    </motion.div>
  );
};
