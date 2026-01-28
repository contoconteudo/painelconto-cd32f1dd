import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Users,
  Briefcase,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  Check,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole, type ModulePermission } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useCompany, Company } from "@/contexts/CompanyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STORAGE_KEYS } from "@/lib/constants";

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
  { name: "Configurações", href: "/configuracoes", icon: Settings, module: "settings" },
  { name: "Admin", href: "/admin", icon: Shield, module: "admin" },
];

// Helper para obter estilo de cor baseado na cor hex do espaço
const getColorStyle = (color: string): React.CSSProperties => {
  // Se a cor é uma classe Tailwind ou inválida, usar fallback
  if (!color || !color.startsWith('#')) {
    return { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' };
  }
  // Criar gradiente a partir da cor hex
  return { background: `linear-gradient(135deg, ${color}, ${color}dd)` };
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentCompany, setCurrentCompany, allowedCompanies, availableSpaces, isAdmin: companyIsAdmin } = useCompany();
  const { role, canAccessModule, isLoading: roleLoading } = useUserRole();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear localStorage data on logout
      localStorage.removeItem(STORAGE_KEYS.LEADS);
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.OBJECTIVES);
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  };

  // Obter informações do espaço atual
  const currentSpace = availableSpaces.find(s => s.id === currentCompany);
  const currentColorStyle = currentSpace 
    ? getColorStyle(currentSpace.color)
    : { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' };
  const currentSpaceName = currentSpace?.label || "Espaço";

  const handleCompanyChange = (company: Company) => {
    setCurrentCompany(company);
    const space = availableSpaces.find(s => s.id === company);
    toast.success(`Alternado para ${space?.label || company}`);
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  // Filtrar espaços permitidos
  const availableCompanySpaces = companyIsAdmin 
    ? availableSpaces 
    : availableSpaces.filter(s => allowedCompanies.includes(s.id));
  const canSwitch = availableCompanySpaces.length > 1;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo and Company Dropdown */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <DropdownMenu>
            <DropdownMenuTrigger 
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-2 py-2 transition-colors",
                canSwitch && "hover:bg-sidebar-accent cursor-pointer"
              )}
              disabled={!canSwitch}
            >
              <div 
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={currentColorStyle}
              >
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-lg font-bold text-sidebar-foreground truncate">
                  {currentSpaceName}
                </span>
                <span className="text-xs text-sidebar-foreground/50">
                  Project Management
                </span>
              </div>
              {canSwitch && (
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 flex-shrink-0" />
              )}
            </DropdownMenuTrigger>
            {canSwitch && (
              <DropdownMenuContent 
                align="start" 
                className="w-56 bg-popover border-border"
                sideOffset={8}
              >
                {availableCompanySpaces.map((space) => (
                  <DropdownMenuItem
                    key={space.id}
                    onClick={() => handleCompanyChange(space.id)}
                    className="cursor-pointer flex items-center gap-3 py-3"
                  >
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={getColorStyle(space.color)}
                    >
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{space.label}</span>
                      <span className="text-xs text-muted-foreground">{space.description}</span>
                    </div>
                    {currentCompany === space.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation
            .filter((item) => canAccessModule(item.module))
            .map((item) => {
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
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-primary">
              {userInitials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email || "Usuário"}
              </p>
              {role && (
                <p className="text-xs text-sidebar-foreground/50 capitalize">
                  {role}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
