import { Search, Plus, Users, Target, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationsPopover } from "./NotificationsPopover";
import { MobileSidebar } from "./MobileSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleNewLead = () => {
    navigate("/crm?action=new-lead");
  };

  const handleNewClient = () => {
    navigate("/clientes?action=new-client");
  };

  const handleNewObjective = () => {
    navigate("/estrategia?action=new-objective");
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6",
      "h-14 md:h-16 safe-area-top"
    )}>
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <MobileSidebar />
        
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search - hidden on mobile, can be expanded */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="w-40 md:w-64 pl-9 bg-muted/50 border-border/60 focus:bg-background h-9"
          />
        </div>

        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className={cn(
              "gradient-primary text-primary-foreground gap-1.5",
              "h-9 px-3 md:px-4"
            )}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
            <DropdownMenuItem onClick={handleNewLead} className="cursor-pointer py-3 touch-manipulation">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewClient} className="cursor-pointer py-3 touch-manipulation">
              <Users className="h-4 w-4 mr-2" />
              Novo Cliente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewObjective} className="cursor-pointer py-3 touch-manipulation">
              <Target className="h-4 w-4 mr-2" />
              Novo Objetivo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
