import { useState, useEffect, useCallback, useRef } from 'react';

interface CallState {
  isRinging: boolean;
  isActive: boolean;
  callDuration: number;
  callerName: string;
  propertyId: string | null;
  propertyName: string;
}

const initialState: CallState = {
  isRinging: false,
  isActive: false,
  callDuration: 0,
  callerName: 'Visitante',
  propertyId: null,
  propertyName: '',
};

export const useCallSimulation = () => {
  const [callState, setCallState] = useState<CallState>(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play ringing sound
  const playRingingSound = useCallback(() => {
    try {
      const ctx = initAudio();
      
      const playTone = () => {
        if (!callState.isRinging || callState.isActive) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 440;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      };

      playTone();
      const interval = setInterval(() => {
        if (callState.isRinging && !callState.isActive) {
          playTone();
        } else {
          clearInterval(interval);
        }
      }, 1500);

      return () => clearInterval(interval);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [callState.isRinging, callState.isActive, initAudio]);

  // Play connection sound
  const playConnectionSound = useCallback(() => {
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 880;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [initAudio]);

  // Play end call sound
  const playEndCallSound = useCallback(() => {
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 220;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, [initAudio]);

  // Start incoming call
  const startIncomingCall = useCallback((propertyId: string | null, propertyName: string, callerName = 'Visitante') => {
    setCallState({
      isRinging: true,
      isActive: false,
      callDuration: 0,
      callerName,
      propertyId,
      propertyName,
    });
  }, []);

  // Answer call
  const answerCall = useCallback(() => {
    playConnectionSound();
    setCallState(prev => ({
      ...prev,
      isRinging: false,
      isActive: true,
      callDuration: 0,
    }));
  }, [playConnectionSound]);

  // End call
  const endCall = useCallback(() => {
    playEndCallSound();
    const duration = callState.callDuration;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setCallState(initialState);
    
    return duration;
  }, [callState.callDuration, playEndCallSound]);

  // Decline call
  const declineCall = useCallback(() => {
    playEndCallSound();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setCallState(initialState);
  }, [playEndCallSound]);

  // Timer effect
  useEffect(() => {
    if (callState.isActive) {
      timerRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          callDuration: prev.callDuration + 1,
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState.isActive]);

  // Ringing sound effect
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (callState.isRinging && !callState.isActive) {
      cleanup = playRingingSound();
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [callState.isRinging, callState.isActive, playRingingSound]);

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    callState,
    startIncomingCall,
    answerCall,
    endCall,
    declineCall,
    formatDuration,
  };
};
