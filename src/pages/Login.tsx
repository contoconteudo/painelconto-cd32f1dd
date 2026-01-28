import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Conta criada com sucesso!");
        navigate("/");
      } else {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (userEmail: string, userPassword: string) => {
    setIsLoading(true);
    try {
      await signIn(userEmail, userPassword);
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
              className="w-full h-11 md:h-10 touch-manipulation" 
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

        {/* Demo Users Card */}
        <div className="p-4 md:p-6 bg-card/50 rounded-xl border border-border/50">
          <Alert className="mb-4 bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>Modo Demonstração:</strong> Use um dos usuários abaixo para testar o sistema.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left h-auto py-2.5 px-3 touch-manipulation"
              onClick={() => quickLogin("admin@conto.com.br", "admin123")}
              disabled={isLoading}
            >
              <span className="font-medium text-xs">Admin</span>
              <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">admin@conto.com.br</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left h-auto py-2.5 px-3 touch-manipulation"
              onClick={() => quickLogin("gestor@conto.com.br", "gestor123")}
              disabled={isLoading}
            >
              <span className="font-medium text-xs">Gestor</span>
              <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">gestor@conto.com.br</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left h-auto py-2.5 px-3 touch-manipulation"
              onClick={() => quickLogin("comercial@conto.com.br", "comercial123")}
              disabled={isLoading}
            >
              <span className="font-medium text-xs">Comercial</span>
              <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">comercial@conto.com.br</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-between text-left h-auto py-2.5 px-3 touch-manipulation"
              onClick={() => quickLogin("analista@conto.com.br", "analista123")}
              disabled={isLoading}
            >
              <span className="font-medium text-xs">Analista</span>
              <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">analista@conto.com.br</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
