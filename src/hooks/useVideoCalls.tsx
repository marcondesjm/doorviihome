import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface VideoCall {
  id: string;
  room_name: string;
  property_id: string | null;
  property_name: string;
  owner_id: string;
  visitor_joined: boolean;
  owner_joined: boolean;
  status: string;
  created_at: string;
  ended_at: string | null;
  audio_message_url?: string | null;
  visitor_audio_url?: string | null;
}

export const useVideoCalls = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeCall, setActiveCall] = useState<VideoCall | null>(null);
  const [visitorJoinedCall, setVisitorJoinedCall] = useState(false);

  // Listen for realtime updates on the active call
  useEffect(() => {
    if (!activeCall?.id) return;

    console.log('Setting up realtime subscription for call:', activeCall.id);

    const channel = supabase
      .channel(`video_call_${activeCall.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `id=eq.${activeCall.id}`,
        },
        (payload) => {
          console.log('Video call updated:', payload.new);
          const updatedCall = payload.new as VideoCall;
          setActiveCall(updatedCall);

          // Notify when visitor joins
          if (updatedCall.visitor_joined && !activeCall.visitor_joined) {
            setVisitorJoinedCall(true);
            toast({
              title: "Visitante conectado!",
              description: "O visitante entrou na chamada. Você pode entrar agora.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removing realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeCall?.id, toast]);

  // Create a new video call session
  const createCall = useCallback(async (propertyId: string | null, propertyName: string) => {
    if (!user) {
      console.error('No user logged in');
      return null;
    }

    const roomName = `${propertyName}_${Date.now()}`.replace(/\s+/g, '_');

    try {
      const { data, error } = await supabase
        .from('video_calls')
        .insert({
          room_name: roomName,
          property_id: propertyId,
          property_name: propertyName,
          owner_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating video call:', error);
        toast({
          title: "Erro ao criar chamada",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      console.log('Video call created:', data);
      setActiveCall(data);
      setVisitorJoinedCall(false);
      return data;
    } catch (err) {
      console.error('Exception creating video call:', err);
      return null;
    }
  }, [user, toast]);

  // Fetch an existing call by room name (for when visitor rings doorbell)
  const fetchCallByRoomName = useCallback(async (roomName: string): Promise<VideoCall | null> => {
    try {
      const { data, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('room_name', roomName)
        .single();

      if (error) {
        console.error('Error fetching call:', error);
        return null;
      }

      if (!data) {
        console.log('No call found for room:', roomName);
        return null;
      }

      const callData: VideoCall = {
        id: data.id,
        room_name: data.room_name,
        property_id: data.property_id,
        property_name: data.property_name,
        owner_id: data.owner_id,
        visitor_joined: data.visitor_joined || false,
        owner_joined: data.owner_joined || false,
        status: data.status,
        created_at: data.created_at,
        ended_at: data.ended_at,
        audio_message_url: data.audio_message_url,
        visitor_audio_url: data.visitor_audio_url,
      };

      console.log('Fetched existing call:', callData);
      setActiveCall(callData);
      setVisitorJoinedCall(callData.visitor_joined);
      return callData;
    } catch (err) {
      console.error('Exception fetching call:', err);
      return null;
    }
  }, []);

  // Owner joins the call
  const ownerJoinCall = useCallback(async () => {
    if (!activeCall?.id) return;

    try {
      const { error } = await supabase
        .from('video_calls')
        .update({
          owner_joined: true,
          status: activeCall.visitor_joined ? 'active' : 'pending',
        })
        .eq('id', activeCall.id);

      if (error) {
        console.error('Error updating owner joined status:', error);
      }
    } catch (err) {
      console.error('Exception updating owner joined status:', err);
    }
  }, [activeCall?.id, activeCall?.visitor_joined]);

  // End the call
  const endCall = useCallback(async () => {
    if (!activeCall?.id) {
      setActiveCall(null);
      setVisitorJoinedCall(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', activeCall.id);

      if (error) {
        console.error('Error ending call:', error);
      }
    } catch (err) {
      console.error('Exception ending call:', err);
    }

    setActiveCall(null);
    setVisitorJoinedCall(false);
  }, [activeCall?.id]);

  return {
    activeCall,
    visitorJoinedCall,
    createCall,
    fetchCallByRoomName,
    ownerJoinCall,
    endCall,
    setVisitorJoinedCall,
  };
};

// Hook for visitor to join a call by room name
export const useVisitorCall = (roomName: string | undefined) => {
  const [callInfo, setCallInfo] = useState<VideoCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerJoined, setOwnerJoined] = useState(false);

  // Fetch call info and set up realtime listener
  useEffect(() => {
    if (!roomName) {
      setLoading(false);
      setError('No room name provided');
      return;
    }

    const fetchCallInfo = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('video_calls')
          .select('*')
          .eq('room_name', roomName)
          .single();

        if (fetchError) {
          console.error('Error fetching call info:', fetchError);
          // If call doesn't exist in DB, it might be an old-style call without sync
          setCallInfo(null);
        } else {
          console.log('Call info fetched:', data);
          setCallInfo(data);
          setOwnerJoined(data.owner_joined);
        }
      } catch (err) {
        console.error('Exception fetching call info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCallInfo();

    // Set up realtime subscription
    const channel = supabase
      .channel(`visitor_call_${roomName}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `room_name=eq.${roomName}`,
        },
        (payload) => {
          console.log('Call updated (visitor view):', payload.new);
          const updatedCall = payload.new as VideoCall;
          setCallInfo(updatedCall);
          setOwnerJoined(updatedCall.owner_joined);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName]);

  // Visitor joins the call
  const visitorJoin = useCallback(async () => {
    if (!roomName) return;

    try {
      // Try to update the call in the database
      const { error: updateError } = await supabase
        .from('video_calls')
        .update({
          visitor_joined: true,
          status: ownerJoined ? 'active' : 'pending',
        })
        .eq('room_name', roomName);

      if (updateError) {
        console.log('Could not update visitor joined (call may not be in DB):', updateError);
      } else {
        console.log('Visitor joined status updated');
      }
    } catch (err) {
      console.error('Exception updating visitor joined:', err);
    }
  }, [roomName, ownerJoined]);

  return {
    callInfo,
    loading,
    error,
    ownerJoined,
    visitorJoin,
  };
};
