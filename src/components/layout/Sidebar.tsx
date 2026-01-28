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
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useCompany, Company } from "@/contexts/CompanyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ModulePermission = 'dashboard' | 'crm' | 'clients' | 'objectives' | 'strategy' | 'settings' | 'admin';

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

const companyInfo: Record<Company, { name: string; gradient: string }> = {
  conto: { 
    name: "Conto", 
    gradient: "bg-gradient-to-br from-primary to-primary/80" 
  },
  amplia: { 
    name: "Amplia", 
    gradient: "bg-gradient-to-br from-blue-600 to-blue-500" 
  },
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentCompany, setCurrentCompany, allowedCompanies, isAdmin } = useCompany();
  const { role, canAccessModule, isLoading: roleLoading } = useUserRole();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear localStorage data on logout
      localStorage.removeItem("conto-leads");
      localStorage.removeItem("conto-clients");
      localStorage.removeItem("conto-objectives");
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  };

  const handleCompanyChange = (company: Company) => {
    setCurrentCompany(company);
    toast.success(`Alternado para ${companyInfo[company].name}`);
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  const currentInfo = companyInfo[currentCompany];
  const availableCompanies = isAdmin ? (["conto", "amplia"] as Company[]) : allowedCompanies;
  const canSwitch = availableCompanies.length > 1;

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
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                currentInfo.gradient
              )}>
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-lg font-bold text-sidebar-foreground truncate">
                  {currentInfo.name}
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
                {availableCompanies.map((company) => (
                  <DropdownMenuItem
                    key={company}
                    onClick={() => handleCompanyChange(company)}
                    className="cursor-pointer flex items-center gap-3 py-3"
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      companyInfo[company].gradient
                    )}>
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{companyInfo[company].name}</span>
                      <span className="text-xs text-muted-foreground">Project Management</span>
                    </div>
                    {currentCompany === company && (
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