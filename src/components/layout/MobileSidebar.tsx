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
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type ModulePermission } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useCompany, Company } from "@/contexts/CompanyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/constants";
import { useState } from "react";

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

const getGradientFromColor = (color: string): string => {
  if (color.includes('primary')) return "bg-gradient-to-br from-primary to-primary/80";
  if (color.includes('blue')) return "bg-gradient-to-br from-blue-600 to-blue-500";
  if (color.includes('green')) return "bg-gradient-to-br from-green-600 to-green-500";
  if (color.includes('purple')) return "bg-gradient-to-br from-purple-600 to-purple-500";
  if (color.includes('orange')) return "bg-gradient-to-br from-orange-600 to-orange-500";
  if (color.includes('cyan')) return "bg-gradient-to-br from-cyan-600 to-cyan-500";
  if (color.includes('rose')) return "bg-gradient-to-br from-rose-600 to-rose-500";
  if (color.includes('amber')) return "bg-gradient-to-br from-amber-600 to-amber-500";
  return "bg-gradient-to-br from-primary to-primary/80";
};

export function MobileSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentCompany, setCurrentCompany, allowedCompanies, availableSpaces, isAdmin: companyIsAdmin } = useCompany();
  const { role, canAccessModule } = useUserRole();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem(STORAGE_KEYS.LEADS);
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.OBJECTIVES);
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  };

  const currentSpace = availableSpaces.find(s => s.id === currentCompany);
  const currentInfo = currentSpace 
    ? { name: currentSpace.label, gradient: getGradientFromColor(currentSpace.color) }
    : { name: "Espaço", gradient: "bg-gradient-to-br from-primary to-primary/80" };

  const handleCompanyChange = (company: Company) => {
    setCurrentCompany(company);
    const space = availableSpaces.find(s => s.id === company);
    toast.success(`Alternado para ${space?.label || company}`);
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  const availableCompanySpaces = companyIsAdmin 
    ? availableSpaces 
    : availableSpaces.filter(s => allowedCompanies.includes(s.id));
  const canSwitch = availableCompanySpaces.length > 1;

  const handleNavClick = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <div className="flex h-full flex-col">
          {/* Logo and Company Dropdown */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <DropdownMenu>
              <DropdownMenuTrigger 
                className={cn(
                  "flex items-center gap-3 flex-1 rounded-lg px-2 py-2 transition-colors",
                  canSwitch && "hover:bg-sidebar-accent"
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
                  {availableCompanySpaces.map((space) => (
                    <DropdownMenuItem
                      key={space.id}
                      onClick={() => handleCompanyChange(space.id)}
                      className="cursor-pointer flex items-center gap-3 py-3"
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        getGradientFromColor(space.color)
                      )}>
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
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={cn(
                      "sidebar-item w-full text-left",
                      isActive && "sidebar-item-active"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
          </nav>

          {/* User section */}
          <div className="border-t border-sidebar-border p-3 space-y-2 safe-area-bottom">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-primary">
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
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
