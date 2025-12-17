import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, ExternalLink, Loader2 } from 'lucide-react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleMeetCallProps {
  propertyName: string;
  onEnd: () => void;
  onMeetLinkCreated?: (meetLink: string) => void;
}

const GoogleMeetCall = ({ propertyName, onEnd, onMeetLinkCreated }: GoogleMeetCallProps) => {
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { accessToken, isAuthenticated, isLoading, signIn, checkExistingToken } = useGoogleAuth();

  useEffect(() => {
    checkExistingToken();
  }, [checkExistingToken]);

  useEffect(() => {
    if (isAuthenticated && accessToken && !meetLink) {
      createMeeting();
    }
  }, [isAuthenticated, accessToken]);

  const createMeeting = async () => {
    if (!accessToken) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-meet', {
        body: { accessToken, propertyName },
      });

      if (error) throw error;

      if (data.meetLink) {
        setMeetLink(data.meetLink);
        onMeetLinkCreated?.(data.meetLink);
        toast.success('Google Meet criado com sucesso!');
        // Open Meet in new tab
        window.open(data.meetLink, '_blank');
      } else {
        throw new Error('No meet link returned');
      }
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      toast.error('Erro ao criar Google Meet. Verifique suas permissões.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndCall = () => {
    setMeetLink(null);
    onEnd();
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Google Meet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conecte-se ao Google para criar chamadas de vídeo.
          </p>
          <Button 
            onClick={signIn} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Conectar com Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-card-foreground">
          Chamada: {propertyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCreating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Criando reunião...</span>
          </div>
        ) : meetLink ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Link da reunião:</p>
              <a 
                href={meetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-2"
              >
                {meetLink}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(meetLink, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Meet
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Encerrar
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={createMeeting} 
            className="w-full"
          >
            <Phone className="h-4 w-4 mr-2" />
            Criar Reunião
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleMeetCall;
