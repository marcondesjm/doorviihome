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
      className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
    >
      <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm sm:text-base truncate">{title}</p>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{property}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{time}</p>
        {duration && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {duration}
          </p>
        )}
      </div>
    </motion.div>
  );
};
