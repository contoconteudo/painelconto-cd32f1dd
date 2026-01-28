import { ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserSession, ModulePermission } from "@/hooks/useUserSession";
import { Loader2, ShieldX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredModule?: ModulePermission;
}

export function ProtectedRoute({ children, requiredModule }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const session = useUserSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  // Loading inicial - máximo 5 segundos (o hook já tem timeout interno)
  if (session.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não autenticado - redirecionar para login
  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Usuário autenticado mas sem role (novo usuário ou banco resetado)
  if (!session.role && !session.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 mb-6">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Conta Pendente</h1>
          <p className="text-muted-foreground mb-6">
            Sua conta foi criada, mas ainda não possui permissões configuradas. 
            Entre em contato com o administrador do sistema para liberar seu acesso.
          </p>
          <div className="space-y-3">
            <Button onClick={() => session.refreshSession()} variant="outline" className="w-full">
              Tentar Novamente
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full">
              Sair e Usar Outra Conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar permissão de módulo (se especificado)
  if (requiredModule && !session.canAccessModule(requiredModule)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar este módulo. 
            Entre em contato com o administrador para solicitar acesso.
          </p>
          <Button onClick={handleLogout} variant="outline">
            Sair e Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
