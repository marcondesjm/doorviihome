import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VisitorAudioRecorderProps {
  roomName: string;
  onAudioSent?: () => void;
  onCancel?: () => void;
}

export const VisitorAudioRecorder = ({ roomName, onAudioSent, onCancel }: VisitorAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try different mimeTypes for browser compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose default
          }
        }
      }
      console.log('VisitorAudioRecorder using mimeType:', mimeType || 'default');
      
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        console.log('Recording stopped, actual mimeType:', actualMimeType);
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setRecordingTime(0);
    onCancel?.();
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    setIsSending(true);
    console.log('Starting visitor audio upload...');
    console.log('Room name:', roomName);
    console.log('Audio blob type:', audioBlob.type);
    console.log('Audio blob size:', audioBlob.size);

    try {
      // Determine file extension based on blob type
      const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      // Sanitize room name to remove special characters for valid storage key
      const sanitizedRoomName = roomName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace special chars with underscore
      const filename = `visitor_audio_${sanitizedRoomName}_${Date.now()}.${extension}`;
      console.log('Uploading file:', filename);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-messages')
        .upload(filename, audioBlob, {
          contentType: audioBlob.type || 'audio/webm',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-messages')
        .getPublicUrl(filename);

      const audioUrl = urlData.publicUrl;
      console.log('Audio URL:', audioUrl);

      // Update video_call with visitor audio response URL
      console.log('Updating video_call with visitor audio...');
      const { data: updateData, error: updateError } = await supabase
        .from('video_calls')
        .update({ 
          visitor_audio_url: audioUrl,
          status: 'visitor_audio_response'
        })
        .eq('room_name', roomName)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Update successful:', updateData);

      toast.success('Resposta enviada ao morador!');
      resetRecorder();
      onAudioSent?.();

    } catch (error: any) {
      console.error('Error sending visitor audio:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao enviar áudio: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex flex-col items-center gap-3 p-3 bg-secondary/50 rounded-xl"
    >
      <AnimatePresence mode="wait">
        {!isRecording && !audioBlob && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-xs text-muted-foreground">Gravar resposta</p>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="default"
                size="lg"
                className="rounded-full w-12 h-12"
                onClick={startRecording}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {isRecording && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div 
              className="flex items-center gap-2"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
            </motion.div>
            
            <div className="flex gap-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={cancelRecording}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-12 h-12"
                  onClick={stopRecording}
                >
                  <Square className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {audioBlob && !isRecording && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 w-full"
          >
            <audio 
              src={URL.createObjectURL(audioBlob)} 
              controls 
              className="w-full max-w-[200px] h-8"
            />
            
            <div className="flex gap-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelRecording}
                  disabled={isSending}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancelar
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="call"
                  size="sm"
                  onClick={sendAudio}
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 mr-1" />
                  )}
                  {isSending ? 'Enviando...' : 'Enviar'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
