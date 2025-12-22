import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Volume2, Play, Pause, Check } from "lucide-react";
import { toast } from "sonner";

interface RingtoneConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RINGTONES = [
  { id: 'doorbell1', name: 'Campainha Clássica', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'doorbell2', name: 'Ding Dong', url: 'https://assets.mixkit.co/active_storage/sfx/2861/2861-preview.mp3' },
  { id: 'doorbell3', name: 'Campainha Digital', url: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3' },
  { id: 'doorbell4', name: 'Notificação Suave', url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
  { id: 'doorbell5', name: 'Alerta Moderno', url: 'https://assets.mixkit.co/active_storage/sfx/2309/2309-preview.mp3' },
  { id: 'doorbell6', name: 'Tom Elegante', url: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3' },
];

export const RingtoneConfigDialog = ({ open, onOpenChange }: RingtoneConfigDialogProps) => {
  const [selectedRingtone, setSelectedRingtone] = useState<string>('doorbell1');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load saved ringtone from localStorage
    const saved = localStorage.getItem('doorvii_ringtone');
    if (saved) {
      setSelectedRingtone(saved);
    }
  }, [open]);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = (ringtoneId: string, url: string) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingId === ringtoneId) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onended = () => {
      setPlayingId(null);
    };
    
    audio.play().catch(() => {
      toast.error('Não foi possível reproduzir o som');
    });
    
    setPlayingId(ringtoneId);
  };

  const handleSave = () => {
    localStorage.setItem('doorvii_ringtone', selectedRingtone);
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
    
    toast.success('Som de toque salvo com sucesso!');
    onOpenChange(false);
  };

  const handleClose = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Som de Toque
          </DialogTitle>
          <DialogDescription>
            Escolha o som que tocará quando um visitante tocar a campainha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={selectedRingtone}
            onValueChange={setSelectedRingtone}
            className="space-y-3"
          >
            {RINGTONES.map((ringtone) => (
              <div
                key={ringtone.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  selectedRingtone === ringtone.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={ringtone.id} id={ringtone.id} />
                  <Label htmlFor={ringtone.id} className="cursor-pointer font-medium">
                    {ringtone.name}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePlay(ringtone.id, ringtone.url)}
                  className="h-8 w-8"
                >
                  {playingId === ringtone.id ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export function to get selected ringtone URL
export const getSelectedRingtoneUrl = (): string => {
  const saved = localStorage.getItem('doorvii_ringtone') || 'doorbell1';
  const ringtone = RINGTONES.find(r => r.id === saved);
  return ringtone?.url || RINGTONES[0].url;
};

export const RINGTONE_OPTIONS = RINGTONES;
