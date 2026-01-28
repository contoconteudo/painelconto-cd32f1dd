import { AppLayout } from "@/components/layout/AppLayout";
import { User, Link, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUserRole } from "@/hooks/useUserRole";

const settingsSections = [
  {
    id: "users",
    title: "Usuários & Permissões",
    description: "Gerencie usuários da equipe e níveis de acesso",
    icon: User,
  },
  {
    id: "integrations",
    title: "Integrações",
    description: "Conecte ferramentas externas (Meta, Analytics, n8n)",
    icon: Link,
  },
  {
    id: "notifications",
    title: "Notificações",
    description: "Configure alertas e canais de comunicação",
    icon: Bell,
  },
];

export default function Configuracoes() {
  const { isAdmin } = useUserRole();

  return (
    <AppLayout title="Configurações" subtitle="Administração do sistema">
      {/* Admin Dashboard Link */}
      {isAdmin && (
        <div className="mb-4 md:mb-6">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 h-11 md:h-10 touch-manipulation"
            onClick={() => window.location.href = '/admin'}
          >
            <Shield className="h-4 w-4" />
            Ir para Dashboard Admin
          </Button>
        </div>
      )}

      {/* Settings Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="stat-card cursor-pointer group touch-manipulation active-press"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                  <Icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">{section.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Settings */}
      <div className="stat-card">
        <h3 className="text-sm md:text-base font-semibold text-foreground mb-4">Configurações Rápidas</h3>
        
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border/60 gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Alertas de Atraso</p>
              <p className="text-xs text-muted-foreground">Notificações automáticas de projetos atrasados</p>
            </div>
            <Switch defaultChecked className="flex-shrink-0" />
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border/60 gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Relatórios Automáticos</p>
              <p className="text-xs text-muted-foreground">Gerar relatórios mensais automaticamente</p>
            </div>
            <Switch defaultChecked className="flex-shrink-0" />
          </div>
          
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Modo Escuro</p>
              <p className="text-xs text-muted-foreground">Alternar tema do sistema</p>
            </div>
            <Switch className="flex-shrink-0" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
