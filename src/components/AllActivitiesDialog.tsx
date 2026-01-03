import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, PhoneIncoming, Bell, Clock, Trash2, Calendar, Download, Trash, Video, Mic, Play, Pause, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllActivities, useDeleteActivity, useDeleteAllActivities, ActivityLog } from "@/hooks/useActivities";
import { useToast } from "@/hooks/use-toast";

type ActivityType = "incoming" | "answered" | "missed" | "doorbell";

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

interface GroupedActivities {
  [date: string]: ActivityLog[];
}

export function AllActivitiesDialog() {
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [playingMediaId, setPlayingMediaId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: activities, isLoading } = useAllActivities();
  const deleteActivity = useDeleteActivity();
  const deleteAllActivities = useDeleteAllActivities();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteActivity.mutateAsync(deleteId);
      toast({
        title: "Atividade excluída",
        description: "A atividade foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a atividade.",
        variant: "destructive",
      });
    }
    setDeleteId(null);
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllActivities.mutateAsync();
      toast({
        title: "Histórico limpo",
        description: "Todas as atividades foram excluídas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir as atividades.",
        variant: "destructive",
      });
    }
    setShowDeleteAllConfirm(false);
  };

  const handleBackup = () => {
    if (!activities || activities.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há atividades para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content with media columns
    const headers = ["Data", "Hora", "Tipo", "Título", "Propriedade", "Duração", "Mídia", "URL Mídia"];
    const rows = activities.map(activity => [
      format(parseISO(activity.created_at), "dd/MM/yyyy"),
      format(parseISO(activity.created_at), "HH:mm"),
      activity.type,
      activity.title,
      activity.property_name,
      activity.duration || "-",
      activity.media_type || "-",
      activity.media_url || "-"
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    // Create and download file
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historico-atividades-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup realizado",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  // Group activities by date
  const groupedActivities: GroupedActivities = {};
  activities?.forEach((activity) => {
    const date = format(parseISO(activity.created_at), "yyyy-MM-dd");
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return "Hoje";
    } else if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
      return "Ontem";
    }
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  const formatActivityTime = (dateStr: string) => {
    return format(parseISO(dateStr), "HH:mm", { locale: ptBR });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            Ver tudo
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Todas as Atividades
            </DialogTitle>
          </DialogHeader>

          {/* Action buttons */}
          {activities && activities.length > 0 && (
            <div className="flex gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleBackup}
              >
                <Download className="w-4 h-4 mr-2" />
                Backup
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteAllConfirm(true)}
              >
                <Trash className="w-4 h-4 mr-2" />
                Excluir tudo
              </Button>
            </div>
          )}
          
          <ScrollArea className="h-[55vh] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedActivities)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([date, dayActivities]) => (
                    <div key={date}>
                      <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-muted-foreground capitalize">
                          {formatDateHeader(date)}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {dayActivities.map((activity) => {
                            const Icon = activity.media_type === 'video' ? Video : 
                                        activity.media_type === 'audio' ? Mic :
                                        iconMap[activity.type as ActivityType] || Bell;
                            const colorClass = activity.media_type 
                              ? "text-primary bg-primary/10" 
                              : colorMap[activity.type as ActivityType] || "text-muted-foreground bg-muted";
                            
                            return (
                              <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2.5 rounded-xl ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm truncate">
                                      {activity.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {activity.property_name}
                                    </p>
                                  </div>

                                  <div className="text-right flex items-center gap-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        {formatActivityTime(activity.created_at)}
                                      </p>
                                      {activity.duration && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                          <Clock className="w-3 h-3" />
                                          {activity.duration}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => setDeleteId(activity.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Media player for audio/video */}
                                {activity.media_url && (
                                  <div className="ml-12 mt-1">
                                    {activity.media_type === 'video' ? (
                                      <div className="relative rounded-lg overflow-hidden bg-black/20">
                                        <video
                                          src={activity.media_url}
                                          controls
                                          className="w-full max-h-40 rounded-lg"
                                          preload="metadata"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <audio
                                          src={activity.media_url}
                                          controls
                                          className="w-full h-8"
                                          preload="metadata"
                                        />
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1 h-6 text-xs text-muted-foreground hover:text-foreground"
                                      onClick={() => window.open(activity.media_url!, '_blank')}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Abrir em nova aba
                                    </Button>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Nenhuma atividade registrada
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete single activity confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A atividade será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all activities confirmation */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todo o histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as {activities?.length || 0} atividades serão permanentemente removidas.
              Recomendamos fazer um backup antes de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
