import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Phone, Video, Home, QrCode, Users, Mic, Volume2, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { ActivityItem } from "@/components/ActivityItem";
import { AllActivitiesDialog } from "@/components/AllActivitiesDialog";
import { StatsCard } from "@/components/StatsCard";
import { QRCodeAccess } from "@/components/QRCodeAccess";
import { IncomingCall } from "@/components/IncomingCall";
import GoogleMeetCall from "@/components/GoogleMeetCall";
import { VideoCallQRCode } from "@/components/VideoCallQRCode";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { EnableNotificationsDialog } from "@/components/EnableNotificationsDialog";
import { InstallAppDialog } from "@/components/InstallAppDialog";
import { KeepAppOpenAlert } from "@/components/KeepAppOpenAlert";

import { PullToRefresh } from "@/components/PullToRefresh";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { useProperties, useUpdateProperty, useDeleteProperty } from "@/hooks/useProperties";
import { useActivities, useAddActivity } from "@/hooks/useActivities";
import { useGenerateAccessCode, useAccessCodes } from "@/hooks/useAccessCodes";
import { useCallSimulation } from "@/hooks/useCallSimulation";
import { useVideoCalls } from "@/hooks/useVideoCalls";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { supabase } from "@/integrations/supabase/client";

import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";

const defaultImages = [property1, property2];

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showQRCode, setShowQRCode] = useState(false);
  const [showGoogleMeet, setShowGoogleMeet] = useState(false);
  const [showVideoCallQR, setShowVideoCallQR] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [doorbellRinging, setDoorbellRinging] = useState(false);
  const [doorbellAnswered, setDoorbellAnswered] = useState(false);
  const doorbellIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [doorbellPropertyName, setDoorbellPropertyName] = useState<string>('');
  const [currentDoorbellRoomName, setCurrentDoorbellRoomName] = useState<string | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [visitorAudioResponse, setVisitorAudioResponse] = useState<string | null>(null);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useActivities();
  const { data: accessCodes } = useAccessCodes();
  
  // Fetch owner phone from profile
  useEffect(() => {
    const fetchOwnerPhone = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user.id)
        .single();
      if (data?.phone) {
        setOwnerPhone(data.phone);
      }
    };
    fetchOwnerPhone();
  }, [user?.id]);
  const addActivity = useAddActivity();
  const generateCode = useGenerateAccessCode();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();
  
  const { accessToken, isAuthenticated, checkExistingToken, signIn: signInGoogle, isLoading: googleAuthLoading } = useGoogleAuth();
  const [pendingAnswer, setPendingAnswer] = useState(false);
  
  // Check for existing Google token on mount
  useEffect(() => {
    checkExistingToken();
  }, [checkExistingToken]);
  
  // When Google auth completes and we have a pending action, proceed with creating Meet
  useEffect(() => {
    if (pendingAnswer && accessToken) {
      setPendingAnswer(false);
      // If QR code is already showing, user was trying to start video - create Meet now
      if (showVideoCallQR) {
        handleStartGoogleMeet();
      }
    }
  }, [accessToken, pendingAnswer, showVideoCallQR]);

  const {
    activeCall,
    visitorJoinedCall,
    createCall,
    fetchCallByRoomName,
    ownerJoinCall,
    endCall: endVideoCall,
    setVisitorJoinedCall,
  } = useVideoCalls();

  const {
    callState,
    startIncomingCall,
    answerCall,
    endCall,
    declineCall,
    formatDuration,
  } = useCallSimulation();

  // Notify when visitor joins the call
  useEffect(() => {
    if (visitorJoinedCall) {
      // Play notification sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        
        // Second beep
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1100;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.3);
        }, 150);
      } catch (e) {
        console.log('Audio not supported');
      }

      toast({
        title: "🔔 Visitante entrou na chamada!",
        description: "Aprove o visitante no Google Meet agora",
        duration: 10000,
      });
    }
  }, [visitorJoinedCall, toast]);

  // Play doorbell sound function
  const playDoorbellSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.value = 659; // E5 - ding
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.5);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 523; // C5 - dong
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.7);
      }, 300);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Clear doorbell interval and stop vibration when stopped
  useEffect(() => {
    if (!doorbellRinging && doorbellIntervalRef.current) {
      clearInterval(doorbellIntervalRef.current);
      doorbellIntervalRef.current = null;
      // Stop any ongoing vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    }
  }, [doorbellRinging]);

  // Listen for doorbell rings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('doorbell-rings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `owner_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new.status === 'doorbell_ringing') {
            setDoorbellRinging(true);
            setDoorbellPropertyName(payload.new.property_name || 'Propriedade');
            setCurrentDoorbellRoomName(payload.new.room_name || null);
            
            // Update property status to online when doorbell rings
            if (payload.new.property_id) {
              await supabase
                .from('properties')
                .update({ is_online: true })
                .eq('id', payload.new.property_id);
            }
            
            // Register activity log for doorbell
            addActivity.mutate({
              property_id: payload.new.property_id || undefined,
              type: 'doorbell',
              title: 'Campainha tocou',
              property_name: payload.new.property_name || 'Propriedade',
            });
            
            // Vibrate phone if supported
            if ('vibrate' in navigator) {
              // Vibration pattern: vibrate 500ms, pause 200ms, vibrate 500ms
              navigator.vibrate([500, 200, 500, 200, 500]);
            }
            
            // Play sound immediately
            playDoorbellSound();
            
            // Keep playing sound and vibrating every 2 seconds until dismissed
            const interval = setInterval(() => {
              playDoorbellSound();
              if ('vibrate' in navigator) {
                navigator.vibrate([500, 200, 500]);
              }
            }, 2000);
            doorbellIntervalRef.current = interval;

            toast({
              title: "🔔 Campainha tocando!",
              description: `Visitante na porta - ${payload.new.property_name}`,
              duration: 10000,
            });
          }
          
          // Handle visitor audio response
          if (payload.new.status === 'visitor_audio_response' && payload.new.visitor_audio_url) {
            setVisitorAudioResponse(payload.new.visitor_audio_url);
            
            // Play notification sound
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 587; // D5
              osc.type = 'sine';
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.2);
            } catch (e) {
              console.log('Audio not supported');
            }
            
            toast({
              title: "🎤 Resposta do visitante!",
              description: "O visitante enviou uma mensagem de áudio",
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Listen for visitor scans on properties with visitor_always_connected enabled
  // This only updates property online status - doorbell notification happens when visitor explicitly rings
  useEffect(() => {
    if (!user || !properties) return;

    // Get properties with visitor_always_connected enabled
    const alwaysConnectedProperties = properties.filter(p => p.visitor_always_connected);
    if (alwaysConnectedProperties.length === 0) return;

    console.log('Monitoring properties with visitor_always_connected:', alwaysConnectedProperties.map(p => p.name));

    const handleVisitorConnected = async (newData: any, property: any) => {
      console.log('Visitor scanned QR for always-connected property:', property.name);
      
      // Only update property status to online - do NOT trigger doorbell
      // The visitor must explicitly press the doorbell button to notify the owner
      await supabase
        .from('properties')
        .update({ is_online: true })
        .eq('id', property.id);
      
      console.log('Property online status updated. Waiting for visitor to ring doorbell.');
    };

    const channel = supabase
      .channel('visitor-auto-connect')
      // Listen for new calls created (when visitor scans QR and call doesn't exist)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_calls',
          filter: `owner_id=eq.${user.id}`,
        },
        async (payload) => {
          const newData = payload.new as any;
          
          // Check if visitor_joined is true (visitor just created this call)
          if (newData.visitor_joined === true) {
            const property = alwaysConnectedProperties.find(p => p.id === newData.property_id);
            if (property) {
              await handleVisitorConnected(newData, property);
            }
          }
        }
      )
      // Listen for updates (when visitor joins existing call)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `owner_id=eq.${user.id}`,
        },
        async (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Check if this is a visitor_joined event (visitor just scanned QR)
          if (newData.visitor_joined === true && oldData?.visitor_joined === false) {
            const property = alwaysConnectedProperties.find(p => p.id === newData.property_id);
            if (property) {
              await handleVisitorConnected(newData, property);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, properties, toast]);

  // Function to notify visitor that owner answered - keeps the interface open
  const handleAnswerDoorbell = async () => {
    console.log('handleAnswerDoorbell called');
    
    // Immediately stop all sounds and vibrations
    if (doorbellIntervalRef.current) {
      clearInterval(doorbellIntervalRef.current);
      doorbellIntervalRef.current = null;
      console.log('Doorbell interval cleared');
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
      console.log('Vibration stopped');
    }
    
    // Stop the ringing state to prevent useEffect from restarting
    setDoorbellRinging(false);
    
    if (!currentDoorbellRoomName) {
      setDoorbellAnswered(false);
      return;
    }
    
    const roomNameToFetch = currentDoorbellRoomName;
    
    try {
      // Update status to answered
      await supabase
        .from('video_calls')
        .update({ status: 'answered' })
        .eq('room_name', roomNameToFetch);
      console.log('Visitor notified - owner answered');
      
      // Fetch the existing call
      const existingCall = await fetchCallByRoomName(roomNameToFetch);
      console.log('Fetched call after answering:', existingCall);
      
      if (existingCall) {
        // Mark as answered but keep interface visible
        setDoorbellAnswered(true);
        toast({
          title: "Chamada atendida!",
          description: "Escolha como deseja se comunicar com o visitante",
        });
      } else {
        console.error('No call found for room:', roomNameToFetch);
        toast({
          title: "Erro",
          description: "Chamada não encontrada",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error answering doorbell:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atender a chamada",
        variant: "destructive",
      });
    }
  };

  // Close the doorbell interface completely
  const handleCloseDoorbell = () => {
    setDoorbellRinging(false);
    setDoorbellAnswered(false);
    setShowAudioRecorder(false);
    setCurrentDoorbellRoomName(null);
    if (activeCall) {
      endCall();
    }
  };

  const proceedWithAnswer = async () => {
    answerCall();
    
    // Create video call in database for real-time sync
    const newCall = await createCall(callState.propertyId, callState.propertyName || 'Propriedade');
    
    if (!newCall) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a chamada. Tente novamente.",
        variant: "destructive",
      });
      declineCall();
      return;
    }
    
    // Show QR code for visitor to scan (Meet link will be created when user clicks to start video)
    setShowVideoCallQR(true);
    
    if (callState.propertyId && properties) {
      const property = properties.find(p => p.id === callState.propertyId);
      if (property) {
        addActivity.mutate({
          property_id: property.id,
          type: 'answered',
          title: 'Aguardando visitante escanear QR',
          property_name: property.name,
          duration: '0:00'
        });
      }
    }
    
    toast({
      title: "QR Code gerado",
      description: "Peça para o visitante escanear o QR Code com o celular",
    });
  };

  const handleAnswer = async () => {
    // Proceed directly without Google auth - auth will be requested when starting video
    await proceedWithAnswer();
  };

  const handleStartGoogleMeet = async () => {
    // If we already have a meet link, just open it
    if (meetLink) {
      window.open(meetLink, '_blank');
      ownerJoinCall();
      setWaitingForApproval(true);
      return;
    }
    
    // Check if authenticated with Google - if not, request auth first
    if (!accessToken) {
      toast({
        title: "Conecte sua conta Google",
        description: "É necessário para criar a videochamada",
      });
      setPendingAnswer(true);
      signInGoogle();
      return;
    }
    
    // Create the Meet link
    setIsCreatingMeet(true);
    toast({
      title: "Criando Google Meet...",
      description: "Aguarde enquanto preparamos a chamada",
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('create-google-meet', {
        body: { accessToken, propertyName: callState.propertyName || 'Propriedade' },
      });

      if (error) throw error;

      if (data.meetLink) {
        setMeetLink(data.meetLink);
        
        // Save meet_link to database for visitor to receive via realtime
        if (activeCall?.id) {
          await supabase
            .from('video_calls')
            .update({ meet_link: data.meetLink } as any)
            .eq('id', activeCall.id);
        }
        
        window.open(data.meetLink, '_blank');
        ownerJoinCall();
        setWaitingForApproval(true);
        toast({
          title: "Google Meet criado!",
          description: "Aprove o visitante quando ele entrar",
        });
      }
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      toast({
        title: "Erro ao criar Meet",
        description: "Não foi possível criar a chamada. Tente reconectar sua conta Google.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const handleApprovalConfirmed = () => {
    setWaitingForApproval(false);
    toast({
      title: "Ótimo!",
      description: "Visitante aprovado com sucesso",
    });
  };

  const handleMeetLinkCreated = (link: string) => {
    setMeetLink(link);
    ownerJoinCall();
  };

  const handleDecline = async () => {
    const duration = endCall();
    setShowGoogleMeet(false);
    setShowVideoCallQR(false);
    setMeetLink(null);
    setWaitingForApproval(false);
    await endVideoCall();
    
    if (callState.isActive && callState.propertyId && properties) {
      const property = properties.find(p => p.id === callState.propertyId);
      if (property) {
        addActivity.mutate({
          property_id: property.id,
          type: 'answered',
          title: 'Chamada finalizada',
          property_name: property.name,
          duration: formatDuration(duration)
        });
      }
    }
    
    toast({
      title: callState.isActive ? "Chamada encerrada" : "Chamada recusada",
      description: callState.isActive 
        ? `Duração: ${formatDuration(duration)}` 
        : "A chamada foi recusada",
    });
  };

  const handleMeetCallEnd = () => {
    setShowGoogleMeet(false);
    setMeetLink(null);
    setWaitingForApproval(false);
    endCall();
    endVideoCall();
    
    if (callState.propertyId && properties) {
      const property = properties.find(p => p.id === callState.propertyId);
      if (property) {
        addActivity.mutate({
          property_id: property.id,
          type: 'answered',
          title: 'Google Meet encerrado',
          property_name: property.name,
        });
      }
    }
    
    toast({
      title: "Chamada encerrada",
      description: "O Google Meet foi finalizado.",
    });
  };

  const handleViewLive = async (propertyId: string, propertyName: string) => {
    // Create a video call session and show QR code for visitor to scan
    const newCall = await createCall(propertyId, propertyName);
    
    if (!newCall) {
      toast({
        title: "Erro",
        description: "Não foi possível conectar à campainha. Tente novamente.",
        variant: "destructive",
      });
      return;
    }
    
    // Update property to online
    await supabase
      .from('properties')
      .update({ is_online: true })
      .eq('id', propertyId);
    
    // Show QR code for visitor to scan
    setShowVideoCallQR(true);
    
    toast({
      title: "Campainha conectada!",
      description: "Agora os visitantes podem escanear o QR Code para chamar você.",
    });
  };

  const handleGenerateQR = async () => {
    if (!showQRCode) {
      const firstProperty = properties?.[0];
      await generateCode.mutateAsync({ 
        propertyId: firstProperty?.id
      });
    }
    setShowQRCode(!showQRCode);
  };

  const latestAccessCode = accessCodes?.[0];

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = activities?.filter(a => {
      const actDate = new Date(a.created_at);
      actDate.setHours(0, 0, 0, 0);
      return actDate.getTime() === today.getTime();
    }) || [];

    const answeredCalls = activities?.filter(a => a.type === 'answered') || [];

    return {
      propertiesCount: properties?.length || 0,
      todayNotifications: todayActivities.length,
      answeredCalls: answeredCalls.length
    };
  }, [properties, activities]);

  // Format activity time
  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Ontem';
    }
    return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <KeepAppOpenAlert />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants} className="text-center py-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Sua portaria na{" "}
              <span className="gradient-text">palma da mão</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Gerencie múltiplos endereços, atenda visitantes de qualquer lugar
              e mantenha sua casa segura com videochamadas instantâneas.
            </p>
          </motion.section>

          {/* Stats */}
          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                icon={Home}
                label="Propriedades"
                value={stats.propertiesCount}
              />
              <StatsCard
                icon={Bell}
                label="Notificações hoje"
                value={stats.todayNotifications}
                trend={stats.todayNotifications > 0 ? "+hoje" : undefined}
                trendUp={stats.todayNotifications > 0}
              />
              <StatsCard
                icon={Phone}
                label="Chamadas atendidas"
                value={stats.answeredCalls}
              />
              <StatsCard
                icon={Video}
                label="Horas de gravação"
                value="24h"
              />
            </div>
          </motion.section>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Properties Section */}
            <motion.section variants={itemVariants} className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Suas Propriedades</h2>
                <AddPropertyDialog />
              </div>

              {propertiesLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Skeleton className="h-64 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                </div>
              ) : properties && properties.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {properties.map((property, index) => (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      name={property.name}
                      address={property.address}
                      isOnline={property.is_online}
                      visitorAlwaysConnected={property.visitor_always_connected}
                      lastActivity={`Adicionada ${formatDistanceToNow(new Date(property.created_at), { locale: ptBR, addSuffix: true })}`}
                      imageUrl={property.image_url || defaultImages[index % defaultImages.length]}
                      onViewLive={() => handleViewLive(property.id, property.name)}
                      onUpdate={(id, data) => {
                        updateProperty.mutate({ propertyId: id, data });
                        const message = data.visitor_always_connected !== undefined
                          ? (data.visitor_always_connected ? "Visitante sempre conectado ativado!" : "Visitante sempre conectado desativado!")
                          : "As alterações foram salvas com sucesso.";
                        toast({
                          title: "Propriedade atualizada",
                          description: message,
                        });
                      }}
                      onDelete={(id) => {
                        deleteProperty.mutate(id, {
                          onSuccess: () => {
                            toast({
                              title: "Propriedade excluída",
                              description: "A propriedade foi removida com sucesso.",
                            });
                          },
                          onError: (error) => {
                            console.error('Failed to delete property:', error);
                            toast({
                              title: "Erro ao excluir",
                              description: "Não foi possível excluir a propriedade.",
                              variant: "destructive",
                            });
                          }
                        });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass rounded-2xl p-12 text-center">
                  <Home className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma propriedade</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione sua primeira propriedade para começar
                  </p>
                  <AddPropertyDialog />
                </div>
              )}
            </motion.section>

            {/* Activity Section */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between gap-2 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold">Atividade Recente</h2>
                <AllActivitiesDialog />
              </div>

              <PullToRefresh 
                onRefresh={async () => {
                  await refetchActivities();
                }}
                className="glass rounded-2xl p-4"
              >
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-1">
                    {activities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        type={activity.type}
                        title={activity.title}
                        property={activity.property_name}
                        time={formatActivityTime(activity.created_at)}
                        duration={activity.duration || undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma atividade recente
                    </p>
                  </div>
                )}
              </PullToRefresh>
            </motion.section>
          </div>

          {/* QR Code Section */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Acesso Rápido</h2>
                <p className="text-muted-foreground">
                  Compartilhe QR Codes para visitantes acessarem facilmente
                </p>
              </div>
              <Button 
                variant="default" 
                onClick={handleGenerateQR}
                disabled={generateCode.isPending}
              >
                <QrCode className="w-4 h-4" />
                {showQRCode ? "Ocultar QR Code" : "Gerar QR Code"}
              </Button>
            </div>

            <AnimatePresence>
              {showQRCode && latestAccessCode && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="max-w-sm mx-auto">
                    <QRCodeAccess
                      accessCode={latestAccessCode.code}
                      expiresIn={formatDistanceToNow(new Date(latestAccessCode.expires_at), { locale: ptBR })}
                      propertyName={properties?.[0]?.name || "Sua Propriedade"}
                      onRefresh={() => {
                        const firstProperty = properties?.[0];
                        generateCode.mutateAsync({ 
                          propertyId: firstProperty?.id
                        });
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Demo Call Button */}
          <motion.section variants={itemVariants} className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Experimente a interface de chamada
            </p>
            <div className="flex flex-row gap-3 justify-center items-center flex-wrap">
              <Button
                variant="accent"
                size="lg"
                onClick={() => {
                  if (properties && properties.length > 0) {
                    handleViewLive(properties[0].id, properties[0].name);
                  } else {
                    startIncomingCall(null, "Propriedade Demo", "Visitante");
                  }
                }}
              >
                <Bell className="w-5 h-5" />
                Simular Chamada
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={async () => {
                  const demoRoomName = 'demo-' + Date.now();
                  const propertyName = properties?.[0]?.name || 'Propriedade Demo';
                  const demoMeetLink = 'https://meet.google.com/demo-test';
                  
                  const { error } = await supabase
                    .from('video_calls')
                    .insert({
                      room_name: demoRoomName,
                      property_name: propertyName,
                      owner_id: user?.id,
                      status: 'pending',
                    });
                  
                  if (error) {
                    toast({ title: "Erro ao criar chamada de teste", variant: "destructive" });
                    return;
                  }
                  
                  const url = `/call/${demoRoomName}?property=${encodeURIComponent(propertyName)}&meet=${encodeURIComponent(demoMeetLink)}`;
                  window.open(url, '_blank');
                  
                  toast({
                    title: "Teste iniciado",
                    description: "Clique em 'Tocar Campainha' na nova aba para testar",
                  });
                }}
              >
                <Phone className="w-5 h-5" />
                Testar Campainha Visitante
              </Button>
            </div>
          </motion.section>
        </motion.div>
      </main>

      {/* Incoming Call Modal - Only when ringing */}
      <AnimatePresence>
        {callState.isRinging && !showGoogleMeet && !showVideoCallQR && (
          <IncomingCall
            callerName={callState.callerName}
            propertyName={callState.propertyName || "Sua Propriedade"}
            onAnswer={handleAnswer}
            onDecline={handleDecline}
            isActive={false}
            callDuration={0}
            formatDuration={formatDuration}
            ownerPhone={ownerPhone || undefined}
          />
        )}
      </AnimatePresence>

      {/* Video Call QR Code - Show after answering to let visitor scan */}
      <AnimatePresence>
        {showVideoCallQR && activeCall && (
          <VideoCallQRCode
            roomName={activeCall.room_name}
            propertyName={activeCall.property_name || callState.propertyName || "Sua Propriedade"}
            onClose={() => {
              setShowVideoCallQR(false);
              endCall();
              endVideoCall();
              setVisitorAudioResponse(null);
            }}
            onStartCall={handleStartGoogleMeet}
            visitorJoined={visitorJoinedCall}
            meetLink={meetLink}
            doorbellRinging={doorbellRinging}
            waitingForApproval={waitingForApproval}
            onApprovalDismiss={handleApprovalConfirmed}
            visitorAudioResponse={visitorAudioResponse}
          />
        )}
      </AnimatePresence>

      {/* Google Meet Call - When call is active */}
      <AnimatePresence>
        {showGoogleMeet && activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <GoogleMeetCall
              propertyName={callState.propertyName || "Sua Propriedade"}
              onEnd={handleMeetCallEnd}
              onMeetLinkCreated={handleMeetLinkCreated}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doorbell Ringing/Answered Alert */}
      <AnimatePresence>
        {(doorbellRinging || doorbellAnswered) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className={`${doorbellAnswered ? 'bg-emerald-600' : 'bg-amber-500'} text-white px-6 py-5 rounded-2xl shadow-lg flex flex-col items-center gap-4 w-full max-w-sm text-center`}
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/20"
                onClick={handleCloseDoorbell}
              >
                <X className="w-5 h-5" />
              </Button>

              {!doorbellAnswered ? (
                // Doorbell is ringing - show answer options
                !showAudioRecorder ? (
                  <>
                    <motion.div
                      animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Bell className="w-10 h-10 animate-bounce" />
                    </motion.div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xl">Campainha tocando!</span>
                      <span className="text-sm text-white/80">{doorbellPropertyName}</span>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white text-amber-600 hover:bg-white/90 w-full"
                        onClick={handleAnswerDoorbell}
                      >
                        <Phone className="w-5 h-5 mr-2" />
                        Atender
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/80 hover:text-white hover:bg-white/20 w-full"
                        onClick={() => setShowAudioRecorder(true)}
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Enviar áudio
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">Gravar mensagem de áudio</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white hover:bg-white/20 -mr-2"
                        onClick={() => setShowAudioRecorder(false)}
                      >
                        Voltar
                      </Button>
                    </div>
                    <AudioRecorder
                      roomName={currentDoorbellRoomName || ''}
                      onAudioSent={() => {
                        // Keep the recorder open to allow sending more messages
                      }}
                      compact
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white text-amber-600 hover:bg-white/90 w-full mt-3"
                      onClick={handleAnswerDoorbell}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Ir atender
                    </Button>
                  </div>
                )
              ) : (
                // Doorbell answered - show communication options
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <Phone className="w-8 h-8" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xl">Chamada atendida!</span>
                    <span className="text-sm text-white/80">{doorbellPropertyName}</span>
                  </div>

                  {/* Visitor Audio Response */}
                  {visitorAudioResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-white/20 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Resposta do visitante</span>
                      </div>
                      <audio
                        controls
                        autoPlay
                        src={visitorAudioResponse}
                        className="w-full h-10"
                        style={{ filter: 'invert(1)' }}
                      />
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col gap-3 w-full">
                    {/* Video Call Option */}
                    <Button
                      variant="secondary"
                      size="lg"
                      className="bg-white text-emerald-600 hover:bg-white/90 w-full"
                      onClick={() => {
                        setShowVideoCallQR(true);
                        handleCloseDoorbell();
                      }}
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Iniciar videochamada
                    </Button>
                    
                    {/* Audio Message Option */}
                    {!showAudioRecorder ? (
                      <Button
                        variant="ghost"
                        size="lg"
                        className="text-white hover:bg-white/20 w-full border border-white/30"
                        onClick={() => setShowAudioRecorder(true)}
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        Enviar áudio
                      </Button>
                    ) : (
                      <div className="bg-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Gravar mensagem</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/70 hover:text-white hover:bg-white/20 h-7 px-2"
                            onClick={() => setShowAudioRecorder(false)}
                          >
                            Fechar
                          </Button>
                        </div>
                        <AudioRecorder
                          roomName={currentDoorbellRoomName || activeCall?.room_name || ''}
                          onAudioSent={() => {
                            toast({
                              title: "Áudio enviado!",
                              description: "O visitante receberá sua mensagem",
                            });
                          }}
                          compact
                        />
                      </div>
                    )}
                    
                    {/* Close/End Option */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white hover:bg-white/10"
                      onClick={handleCloseDoorbell}
                    >
                      Encerrar
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Visitor Audio Response */}
      <AnimatePresence>
        {visitorAudioResponse && !showVideoCallQR && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 100, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-50 w-[90vw] max-w-sm"
          >
            <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="font-semibold">Resposta do Visitante</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setVisitorAudioResponse(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <audio 
                src={visitorAudioResponse} 
                controls 
                autoPlay
                className="w-full h-10"
              />
              {activeCall && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setShowVideoCallQR(true)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Abrir QR Code da chamada
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Notification Permission Dialog */}
      <EnableNotificationsDialog />
      
      {/* Install App Dialog */}
      <InstallAppDialog />
    </div>
  );
};

export default Index;
