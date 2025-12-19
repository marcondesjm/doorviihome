import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Phone, Video, Home, QrCode, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { ActivityItem } from "@/components/ActivityItem";
import { StatsCard } from "@/components/StatsCard";
import { QRCodeAccess } from "@/components/QRCodeAccess";
import { IncomingCall } from "@/components/IncomingCall";
import GoogleMeetCall from "@/components/GoogleMeetCall";
import { VideoCallQRCode } from "@/components/VideoCallQRCode";
import { AddPropertyDialog } from "@/components/AddPropertyDialog";
import { ApprovalReminderAlert } from "@/components/ApprovalReminderAlert";
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
  const [doorbellInterval, setDoorbellInterval] = useState<NodeJS.Timeout | null>(null);
  const [doorbellPropertyName, setDoorbellPropertyName] = useState<string>('');
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: accessCodes } = useAccessCodes();
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
  
  // When Google auth completes and we have a pending answer, proceed with the call
  useEffect(() => {
    if (pendingAnswer && accessToken) {
      setPendingAnswer(false);
      proceedWithAnswer();
    }
  }, [accessToken, pendingAnswer]);

  const {
    activeCall,
    visitorJoinedCall,
    createCall,
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

  // Clear doorbell interval when stopped
  useEffect(() => {
    if (!doorbellRinging && doorbellInterval) {
      clearInterval(doorbellInterval);
      setDoorbellInterval(null);
    }
  }, [doorbellRinging, doorbellInterval]);

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
            
            // Update property status to online when doorbell rings
            if (payload.new.property_id) {
              await supabase
                .from('properties')
                .update({ is_online: true })
                .eq('id', payload.new.property_id);
            }
            
            // Play sound immediately
            playDoorbellSound();
            
            // Keep playing sound every 2 seconds until dismissed
            const interval = setInterval(() => {
              playDoorbellSound();
            }, 2000);
            setDoorbellInterval(interval);

            toast({
              title: "🔔 Campainha tocando!",
              description: `Visitante na porta - ${payload.new.property_name}`,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

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
    
    // Create the Meet link FIRST before showing QR
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
        toast({
          title: "Google Meet criado!",
          description: "QR Code pronto para o visitante",
        });
      }
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      toast({
        title: "Erro ao criar Meet",
        description: "Não foi possível criar a chamada",
        variant: "destructive",
      });
      setIsCreatingMeet(false);
      return;
    } finally {
      setIsCreatingMeet(false);
    }
    
    // Show QR code for visitor to scan (now with meetLink)
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
    // If not authenticated with Google, prompt for auth first
    if (!accessToken) {
      toast({
        title: "Conecte sua conta Google",
        description: "É necessário para criar a videochamada",
      });
      setPendingAnswer(true);
      signInGoogle();
      return;
    }
    
    // If already authenticated, proceed directly
    await proceedWithAnswer();
  };

  const handleStartGoogleMeet = async () => {
    // If we already have a meet link, just open it
    if (meetLink) {
      window.open(meetLink, '_blank');
      ownerJoinCall();
      setWaitingForApproval(true); // Start the approval reminder
      return;
    }
    
    setShowVideoCallQR(false);
    setShowGoogleMeet(true);
    
    toast({
      title: "Iniciando Google Meet",
      description: "Criando reunião...",
    });
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

  const handleViewLive = (propertyId: string, propertyName: string) => {
    startIncomingCall(propertyId, propertyName, 'Visitante');
    addActivity.mutate({
      property_id: propertyId,
      type: 'doorbell',
      title: 'Campainha tocou',
      property_name: propertyName
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
                      lastActivity={`Adicionada ${formatDistanceToNow(new Date(property.created_at), { locale: ptBR, addSuffix: true })}`}
                      imageUrl={property.image_url || defaultImages[index % defaultImages.length]}
                      onViewLive={() => handleViewLive(property.id, property.name)}
                      onUpdate={(id, data) => {
                        updateProperty.mutate({ propertyId: id, data });
                        toast({
                          title: "Propriedade atualizada",
                          description: "As alterações foram salvas com sucesso.",
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Atividade Recente</h2>
                <Button variant="ghost" size="sm">
                  Ver tudo
                </Button>
              </div>

              <div className="glass rounded-2xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
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
              </div>
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
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
          />
        )}
      </AnimatePresence>

      {/* Video Call QR Code - Show after answering to let visitor scan */}
      <AnimatePresence>
        {showVideoCallQR && activeCall && (
          <VideoCallQRCode
            roomName={activeCall.room_name}
            propertyName={callState.propertyName || "Sua Propriedade"}
            onClose={() => {
              setShowVideoCallQR(false);
              endCall();
              endVideoCall();
            }}
            onStartCall={handleStartGoogleMeet}
            visitorJoined={visitorJoinedCall}
            meetLink={meetLink}
            doorbellRinging={doorbellRinging}
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

      {/* Approval Reminder Alert - Shows after owner joins Meet */}
      <ApprovalReminderAlert
        isVisible={waitingForApproval}
        onDismiss={handleApprovalConfirmed}
        propertyName={callState.propertyName || "Sua Propriedade"}
      />

      {/* Doorbell Ringing Alert */}
      <AnimatePresence>
        {doorbellRinging && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-amber-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
              <Bell className="w-6 h-6 animate-bounce" />
              <div className="flex flex-col">
                <span className="font-semibold">Campainha tocando!</span>
                <span className="text-sm text-white/80">{doorbellPropertyName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-amber-600 ml-2"
                onClick={() => setDoorbellRinging(false)}
              >
                Atender
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
