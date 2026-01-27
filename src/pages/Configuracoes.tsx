import { AppLayout } from "@/components/layout/AppLayout";
import { User, Link, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
  return (
    <AppLayout title="Configurações" subtitle="Administração do sistema">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="stat-card cursor-pointer group hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Settings */}
      <div className="stat-card">
        <h3 className="text-base font-semibold text-foreground mb-4">Configurações Rápidas</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border/60">
            <div>
              <p className="text-sm font-medium text-foreground">Alertas de Atraso</p>
              <p className="text-xs text-muted-foreground">Notificações automáticas de projetos atrasados</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-border/60">
            <div>
              <p className="text-sm font-medium text-foreground">Relatórios Automáticos</p>
              <p className="text-xs text-muted-foreground">Gerar relatórios mensais automaticamente</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Modo Escuro</p>
              <p className="text-xs text-muted-foreground">Alternar tema do sistema</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
