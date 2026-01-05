import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Home, Bell, MoreVertical, Pencil, Camera, Trash2, UserCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PropertyCardProps {
  id: string;
  name: string;
  address: string;
  isOnline: boolean;
  visitorAlwaysConnected?: boolean;
  lastActivity?: string;
  imageUrl?: string;
  onViewLive: () => void;
  onUpdate?: (id: string, data: { name?: string; image_url?: string; visitor_always_connected?: boolean }) => void;
  onDelete?: (id: string) => void;
}

export const PropertyCard = ({
  id,
  name,
  address,
  isOnline,
  visitorAlwaysConnected = false,
  lastActivity,
  imageUrl,
  onViewLive,
  onUpdate,
  onDelete,
}: PropertyCardProps) => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState(name);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    if (onUpdate && editName.trim()) {
      onUpdate(id, { name: editName.trim() });
      setShowEditDialog(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdate) return;

    setIsUploading(true);
    try {
      // Convert to base64 data URL for now (simple approach)
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onUpdate(id, { image_url: result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsUploading(false);
    }
  };

  return (
    <>
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
              visitorAlwaysConnected 
                ? "bg-success/20 text-success border border-success/30" 
                : "bg-muted/80 text-muted-foreground border border-border"
            }`}>
              <span className={`w-2 h-2 rounded-full ${visitorAlwaysConnected ? "bg-success animate-pulse-soft" : "bg-muted-foreground"}`} />
              {visitorAlwaysConnected ? "Online" : "Offline"}
            </div>
          </div>

          {/* Quick Actions - Dropdown Menu */}
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="glass" 
                  size="icon" 
                  className="h-8 w-8 bg-background/80 hover:bg-background/90"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setEditName(name);
                  setShowEditDialog(true);
                }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar nome
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                  <Camera className="w-4 h-4 mr-2" />
                  Alterar foto
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/qrcode/${id}`);
                  }}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ver QR Code
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUpdate) {
                      onUpdate(id, { visitor_always_connected: !visitorAlwaysConnected });
                    }
                  }}
                  className={visitorAlwaysConnected ? "text-success focus:text-success" : ""}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {visitorAlwaysConnected ? "Desativar" : "Ativar"} visitante sempre conectado
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir propriedade
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Live View Button */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
            <Button variant="default" size="sm" onClick={() => navigate(`/qrcode/${id}`)} className="gap-2">
              <Bell className="w-4 h-4" />
              Conectar na campainha
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

      {/* Edit Name Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Propriedade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="property-name">Nome da propriedade</Label>
              <Input
                id="property-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Casa Principal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveName}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir propriedade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  onDelete(id);
                }
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
