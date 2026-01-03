import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Square, Send, X, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VisitorVideoRecorderProps {
  roomName: string;
  onVideoSent?: () => void;
  onCancel?: () => void;
}

export const VisitorVideoRecorder = ({ roomName, onVideoSent, onCancel }: VisitorVideoRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: true 
      });
      
      // Verify video track exists
      const videoTracks = mediaStream.getVideoTracks();
      const audioTracks = mediaStream.getAudioTracks();
      console.log('Video tracks:', videoTracks.length, videoTracks.map(t => t.label));
      console.log('Audio tracks:', audioTracks.length, audioTracks.map(t => t.label));
      
      if (videoTracks.length === 0) {
        console.error('No video track found!');
        toast.error('Câmera não encontrada. Verifique as permissões.');
        return;
      }
      
      setStream(mediaStream);
      setIsExpanded(true);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const startRecording = () => {
    if (!stream) return;

    try {
      // Verify stream has video track before recording
      const videoTracks = stream.getVideoTracks();
      console.log('Starting recording with video tracks:', videoTracks.length);
      
      if (videoTracks.length === 0) {
        console.error('No video track in stream!');
        toast.error('Erro: câmera não está ativa');
        return;
      }

      // Try different mimeTypes for browser compatibility - prioritize video codecs
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4;codecs=h264,aac',
        'video/mp4',
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      console.log('VisitorVideoRecorder using mimeType:', selectedMimeType || 'default');
      
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good video quality
        audioBitsPerSecond: 128000,  // 128 kbps for audio
      };
      
      if (selectedMimeType) {
        options.mimeType = selectedMimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        console.log('Data available:', e.data.size, 'bytes, type:', e.data.type);
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || 'video/webm';
        console.log('Recording stopped, actual mimeType:', actualMimeType);
        console.log('Total chunks:', chunksRef.current.length);
        const totalSize = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
        console.log('Total recording size:', totalSize, 'bytes');
        
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
        setVideoBlob(blob);
      };

      // Request data every 1 second to ensure we capture everything
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Não foi possível iniciar a gravação.');
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
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setVideoBlob(null);
    setRecordingTime(0);
    setIsExpanded(false);
    onCancel?.();
  };

  const resetRecorder = () => {
    setVideoBlob(null);
    setRecordingTime(0);
    // Keep camera active for re-recording
    if (videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
    }
  };

  const sendVideo = async () => {
    if (!videoBlob) return;

    setIsSending(true);
    console.log('Starting visitor video upload...');
    console.log('Room name:', roomName);
    console.log('Video blob type:', videoBlob.type);
    console.log('Video blob size:', videoBlob.size);

    try {
      // Determine file extension based on blob type
      const extension = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      // Sanitize room name
      const sanitizedRoomName = roomName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `visitor_video_${sanitizedRoomName}_${Date.now()}.${extension}`;
      console.log('Uploading file:', filename);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-messages')
        .upload(filename, videoBlob, {
          contentType: videoBlob.type || 'video/webm',
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

      const videoUrl = urlData.publicUrl;
      console.log('Video URL:', videoUrl);

      // Update video_call with visitor video response URL
      console.log('Updating video_call with visitor video...');
      const { data: updateData, error: updateError } = await supabase
        .from('video_calls')
        .update({ 
          visitor_audio_url: videoUrl,
          status: 'visitor_audio_response'
        })
        .eq('room_name', roomName)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Update successful:', updateData);

      toast.success('Vídeo enviado ao morador!');
      cancelRecording();
      onVideoSent?.();

    } catch (error: any) {
      console.error('Error sending visitor video:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao enviar vídeo: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Compact button when not expanded
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border border-border rounded-xl p-4 bg-muted/30"
      >
        <p className="text-xs text-muted-foreground mb-3 text-center">Envie uma mensagem em vídeo</p>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="lg"
            className="w-full font-semibold"
            onClick={startCamera}
          >
            <Video className="w-5 h-5" />
            Gravar Vídeo
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="border border-border rounded-xl p-4 bg-muted/30"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Gravar Vídeo</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={cancelRecording}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {!videoBlob ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Video preview */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {isRecording && (
                <motion.div 
                  className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-white text-xs font-mono">{formatTime(recordingTime)}</span>
                </motion.div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex gap-3">
              {!isRecording ? (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-14 h-14"
                    onClick={startRecording}
                  >
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-14 h-14"
                    onClick={stopRecording}
                  >
                    <Square className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {isRecording ? 'Toque para parar' : 'Toque para gravar'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Video playback preview */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              <video
                src={URL.createObjectURL(videoBlob)}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={resetRecorder}
                disabled={isSending}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Regravar
              </Button>
              <Button
                variant="call"
                size="sm"
                className="flex-1"
                onClick={sendVideo}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                {isSending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
