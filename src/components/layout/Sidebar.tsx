import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Users,
  Briefcase,
  
  Settings,
  ChevronDown,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Estratégia", href: "/estrategia", icon: Target },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Clientes", href: "/clientes", icon: Briefcase },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">Conto</span>
            <span className="ml-1 text-xs text-sidebar-foreground/50">CMS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-primary">
              AR
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-sidebar-foreground">Arone</p>
              <p className="text-xs text-sidebar-foreground/50">Admin</p>
            </div>
            <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
          </button>
        </div>
      </div>
    </aside>
  );
}
