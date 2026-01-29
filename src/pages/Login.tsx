import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Redirecionar se já estiver autenticado (apenas para acesso direto à página)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Conta criada com sucesso!");
      } else {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
      }
      
      // Redirecionamento forçado - aguarda um pequeno delay para o cache atualizar
      setTimeout(() => {
        window.location.replace("/");
      }, 100);
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      toast.error(error.message || "Erro ao processar solicitação");
      setIsLoading(false);
    }
  };

  // Mostrar loading apenas durante verificação inicial de sessão existente
  // Se terminar de carregar sem sessão, mostra o formulário
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        <div className="p-6 md:p-8 space-y-5 md:space-y-6 bg-card rounded-xl border border-border shadow-lg">
          <div className="text-center space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Conto Management System
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {isSignUp ? "Crie sua conta" : "Faça login para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 md:h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                className="h-11 md:h-10"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 md:h-10 touch-manipulation uppercase" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline touch-manipulation py-2"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
            >
              {isSignUp
                ? "Já tem uma conta? Faça login"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
