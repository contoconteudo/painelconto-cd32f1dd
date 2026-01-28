import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Target, Users, Briefcase, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole, type ModulePermission } from "@/hooks/useUserRole";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module: ModulePermission;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, module: "dashboard" },
  { name: "Estratégia", href: "/estrategia", icon: Target, module: "strategy" },
  { name: "CRM", href: "/crm", icon: Users, module: "crm" },
  { name: "Clientes", href: "/clientes", icon: Briefcase, module: "clients" },
  { name: "Config", href: "/configuracoes", icon: Settings, module: "settings" },
];

export function MobileNav() {
  const location = useLocation();
  const { canAccessModule, isAdmin } = useUserRole();

  const visibleNavItems = navigation.filter((item) => canAccessModule(item.module));
  
  // If admin, show admin page in nav
  if (isAdmin) {
    visibleNavItems.push({ name: "Admin", href: "/admin", icon: Shield, module: "admin" });
  }

  // Limit to 5 items for bottom nav
  const displayItems = visibleNavItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {displayItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] touch-manipulation",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground active:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium leading-none",
                isActive ? "text-primary" : "text-sidebar-foreground"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
