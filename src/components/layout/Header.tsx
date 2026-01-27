import { Search, Plus, Users, Target, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationsPopover } from "./NotificationsPopover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="w-64 pl-9 bg-muted/50 border-border/60 focus:bg-background"
          />
        </div>

        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleNewLead} className="cursor-pointer">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewClient} className="cursor-pointer">
              <Users className="h-4 w-4 mr-2" />
              Novo Cliente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewObjective} className="cursor-pointer">
              <Target className="h-4 w-4 mr-2" />
              Novo Objetivo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
