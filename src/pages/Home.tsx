import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Video, 
  Bell, 
  Shield, 
  Smartphone, 
  QrCode, 
  Users,
  ArrowRight,
  Home as HomeIcon
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Video,
      title: "Videochamadas",
      description: "Converse com visitantes em tempo real através de videochamadas seguras"
    },
    {
      icon: Bell,
      title: "Notificações",
      description: "Receba alertas instantâneos quando alguém tocar sua campainha"
    },
    {
      icon: Shield,
      title: "Segurança",
      description: "Controle de acesso com códigos temporários e autenticação"
    },
    {
      icon: QrCode,
      title: "QR Code",
      description: "Gere QR Codes para acesso rápido dos visitantes"
    },
    {
      icon: Users,
      title: "Multi-usuários",
      description: "Convide familiares para gerenciar suas propriedades"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Interface otimizada para uso em qualquer dispositivo"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">DoorVii Home</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="gap-2">
                Acessar Painel <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
                <Button onClick={() => navigate("/auth")} className="gap-2">
                  Começar Agora <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Bell className="w-4 h-4" />
            Sua campainha inteligente
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Controle sua casa de
            <span className="text-primary"> qualquer lugar</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            DoorVii Home transforma sua campainha em uma central de segurança inteligente. 
            Atenda visitantes, gerencie acessos e proteja sua família com tecnologia de ponta.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="gap-2 text-lg px-8"
            >
              {user ? "Ir para o Painel" : "Criar Conta Grátis"}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Conhecer Recursos
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Recursos completos para transformar a segurança da sua casa
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Junte-se a milhares de famílias que já usam DoorVii Home para proteger suas casas.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="gap-2"
            >
              {user ? "Acessar Painel" : "Começar Gratuitamente"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">DoorVii Home</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 DoorVii Home. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
