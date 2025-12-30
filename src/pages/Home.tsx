import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { 
  Video, 
  Bell, 
  Shield, 
  Smartphone, 
  QrCode, 
  Users,
  ArrowRight,
  Home as HomeIcon,
  Star,
  Quote,
  Play,
  User,
  Building,
  Check,
  Zap,
  Crown,
  Sparkles
} from "lucide-react";
import PlanCheckoutDialog from "@/components/PlanCheckoutDialog";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "", price: 0 });

  const handleSelectPlan = (planName: string, planPrice: number) => {
    setSelectedPlan({ name: planName, price: planPrice });
    setCheckoutOpen(true);
  };

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

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Moradora - São Paulo",
      content: "O DoorVii Home mudou completamente a forma como gerencio a segurança da minha casa. Agora consigo ver quem está na porta mesmo quando estou no trabalho!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Empresário - Rio de Janeiro",
      content: "Excelente solução! A videochamada é muito fluida e o sistema de códigos temporários é perfeito para receber entregas quando não estou em casa.",
      rating: 5
    },
    {
      name: "Ana Oliveira",
      role: "Síndica - Florianópolis",
      content: "Implementamos em todo o condomínio. Os moradores adoraram a praticidade e a segurança que o sistema oferece. Recomendo muito!",
      rating: 5
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Header */}
      <motion.header 
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">DoorVii Home</span>
          </motion.div>
          <div className="flex items-center gap-3">
            {user ? (
              (() => {
                // Auto-redirect logged users to dashboard
                navigate("/dashboard", { replace: true });
                return null;
              })()
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" onClick={() => navigate("/auth")}>
                    Entrar
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => navigate("/auth")} className="gap-2">
                    Começar Agora <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div 
          className="max-w-3xl mx-auto space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
            variants={itemVariants}
          >
            <Bell className="w-4 h-4" />
            Sua campainha inteligente
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-foreground leading-tight"
            variants={itemVariants}
          >
            Controle sua casa de
            <span className="text-primary"> qualquer lugar</span>
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            variants={itemVariants}
          >
            DoorVii Home transforma sua campainha em uma central de segurança inteligente. 
            Atenda visitantes, gerencie acessos e proteja sua família com tecnologia de ponta.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            variants={itemVariants}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
                className="gap-2 text-lg px-8"
              >
                {user ? "Ir para o Painel" : "Conta Teste"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Conhecer Recursos
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Bell className="w-4 h-4" />
            Planos de Assinatura
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comece gratuitamente e faça upgrade quando precisar de mais recursos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Plano Essencial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full border-2 hover:border-green-500/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Essencial</h3>
                    <p className="text-sm text-muted-foreground">Para residências individuais</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">R$ 9,90</span>
                    <span className="text-muted-foreground">/ mês</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-grow mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Campainha virtual ativa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">QR Code permanente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Aviso instantâneo ao morador</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Acesso via celular (sem app obrigatório)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Suporte básico</span>
                  </li>
                </ul>

                <div className="text-center text-xs text-muted-foreground mb-4">
                  🎯 Ideal para casas e apartamentos
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-green-500/50 hover:bg-green-500/10 hover:text-green-600"
                  onClick={() => handleSelectPlan("Essencial", 9.90)}
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plano Plus - Destaque */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden scale-[1.02]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              <div className="absolute -top-0 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-b-lg">
                POPULAR
              </div>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Plus</h3>
                    <p className="text-sm text-muted-foreground">Mais controle e personalização</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">R$ 19,90</span>
                    <span className="text-muted-foreground">/ mês</span>
                  </div>
                </div>

                <div className="text-xs text-primary font-medium mb-3">Tudo do Essencial +</div>

                <ul className="space-y-3 flex-grow mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Nome da residência personalizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Mensagem personalizada na tela</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Histórico de toques (últimos acessos)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Suporte prioritário</span>
                  </li>
                </ul>

                <div className="text-center text-xs text-muted-foreground mb-4">
                  🎯 Ideal para famílias, home office
                </div>

                <Button 
                  className="w-full"
                  onClick={() => handleSelectPlan("Plus", 19.90)}
                >
                  Escolher Plus
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Plano Pro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full border-2 hover:border-purple-500/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Pro</h3>
                    <p className="text-sm text-muted-foreground">Para condomínios e uso profissional</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">R$ 39,90</span>
                    <span className="text-muted-foreground">/ mês</span>
                  </div>
                </div>

                <div className="text-xs text-purple-500 font-medium mb-3">Tudo do Plus +</div>

                <ul className="space-y-3 flex-grow mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Múltiplos moradores/notificações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Página personalizada com identidade visual</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Suporte VIP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Prioridade em novas funções</span>
                  </li>
                </ul>

                <div className="text-center text-xs text-muted-foreground mb-4">
                  🎯 Ideal para condomínios, empresas, escritórios
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-600"
                  onClick={() => handleSelectPlan("Pro", 39.90)}
                >
                  Escolher Pro
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Opcionais/Upsell */}
        <motion.div
          className="mt-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
                🧩 Opcionais Disponíveis
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">➕ Domínio personalizado</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">➕ Integração WhatsApp Business</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">➕ Mensagem automática para entregadores</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground">➕ Relatórios mensais de acessos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Recursos completos para transformar a segurança da sua casa
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={featureCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <motion.div 
                    className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Milhares de famílias já confiam no DoorVii Home
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 flex flex-col h-full">
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground flex-grow mb-4">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="container mx-auto px-4 py-20"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary-foreground/5 to-transparent"
              animate={{ 
                x: ["-100%", "100%"],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <h2 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">
              Pronto para começar?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto relative z-10">
              Junte-se a milhares de famílias que já usam DoorVii Home para proteger suas casas.
            </p>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
                className="gap-2"
              >
                {user ? "Acessar Painel" : "Começar Gratuitamente"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="container mx-auto px-4 py-8 border-t"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
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
      </motion.footer>

      {/* Plan Checkout Dialog */}
      <PlanCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        planName={selectedPlan.name}
        planPrice={selectedPlan.price}
      />
    </div>
  );
};

export default Home;
