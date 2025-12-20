import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, CheckCircle2, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center"
        >
          <Smartphone className="w-12 h-12 text-primary" />
        </motion.div>

        {isInstalled ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
              <h1 className="text-2xl font-bold">App Instalado!</h1>
            </div>
            <p className="text-muted-foreground mb-8">
              O DoorVii Home já está instalado no seu dispositivo. Você pode acessá-lo pela tela inicial.
            </p>
            <Button onClick={() => navigate("/dashboard")} size="lg" className="w-full">
              Ir para o Dashboard
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Instalar DoorVii Home</h1>
            <p className="text-muted-foreground mb-8">
              Instale o app no seu celular para receber notificações e atender visitantes mais rápido.
            </p>

            <div className="glass rounded-2xl p-6 mb-6 text-left space-y-4">
              <h2 className="font-semibold text-lg mb-4">Benefícios</h2>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <span>Acesso rápido pela tela inicial</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <span>Funciona offline</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <span>Experiência de app nativo</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <span>Sem ocupar espaço de armazenamento</span>
              </div>
            </div>

            {deferredPrompt ? (
              <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                <Download className="w-5 h-5" />
                Instalar Agora
              </Button>
            ) : isIOS ? (
              <div className="glass rounded-2xl p-6 text-left">
                <h2 className="font-semibold mb-4">Como instalar no iPhone/iPad:</h2>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div className="flex items-center gap-2">
                      Toque no botão <Share className="w-5 h-5 text-primary" /> Compartilhar
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div className="flex items-center gap-2">
                      Role e toque em <Plus className="w-5 h-5 text-primary" /> "Adicionar à Tela de Início"
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <span>Toque em "Adicionar" para confirmar</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="glass rounded-2xl p-6 text-left">
                <h2 className="font-semibold mb-4">Como instalar no Android:</h2>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div className="flex items-center gap-2">
                      Toque no menu <MoreVertical className="w-5 h-5 text-primary" /> do navegador
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <span>Toque em "Instalar" para confirmar</span>
                  </li>
                </ol>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mt-4 w-full"
            >
              Continuar no navegador
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Install;
