import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { Shield, AlertCircle, Info, Building2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSpaces, Space, SPACE_COLORS } from "@/hooks/useSpaces";

const AVAILABLE_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Acesso total ao sistema" },
  { value: "gestor", label: "Gestor", description: "Gerencia estratégia e equipe" },
  { value: "comercial", label: "Comercial", description: "Foco em CRM e clientes" },
  { value: "analista", label: "Analista", description: "Acesso restrito" },
];

const getRoleBadgeStyle = (role: AppRole) => {
  switch (role) {
    case "admin":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "gestor":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "comercial":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "analista":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function AdminDashboard() {
  const { isAdmin, role } = useUserRole();
  const { spaces, createSpace, deleteSpace, SPACE_COLORS, isLoading: spacesLoading } = useSpaces();

  // Estado para criar novo espaço
  const [showNewSpaceDialog, setShowNewSpaceDialog] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState(SPACE_COLORS[2].value); // Verde por padrão
  const [creatingSpace, setCreatingSpace] = useState(false);

  // Estado para confirmar exclusão de espaço
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers para gestão de espaços
  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) {
      toast.error("Nome do espaço é obrigatório");
      return;
    }

    setCreatingSpace(true);
    const result = await createSpace(newSpaceName, newSpaceDescription, newSpaceColor);
    setCreatingSpace(false);
    
    if (result.success) {
      toast.success(`Espaço "${result.space?.label}" criado com sucesso!`);
      setShowNewSpaceDialog(false);
      setNewSpaceName("");
      setNewSpaceDescription("");
      setNewSpaceColor(SPACE_COLORS[2].value);
    } else {
      toast.error(result.error || "Erro ao criar espaço");
    }
  };

  const handleDeleteSpace = async () => {
    if (!deletingSpace) return;
    
    setIsDeleting(true);
    const result = await deleteSpace(deletingSpace.id);
    setIsDeleting(false);
    
    if (result.success) {
      toast.success(`Espaço "${deletingSpace.label}" excluído!`);
      setDeletingSpace(null);
    } else {
      toast.error(result.error || "Erro ao excluir espaço");
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout title="Acesso Negado" subtitle="Você não tem permissão para acessar esta página">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta página é restrita a administradores do sistema.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Administração"
      subtitle="Gerencie espaços e configurações do sistema"
    >
      <div className="space-y-4 md:space-y-6">
        {/* Info Card */}
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs md:text-sm">
            <strong>Status:</strong> Você está logado como <Badge variant="outline" className={cn("ml-1", getRoleBadgeStyle(role || "user"))}>{role}</Badge>.
            Gerencie os espaços (empresas) do sistema abaixo.
          </AlertDescription>
        </Alert>

        {/* Spaces Overview */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <h3 className="text-sm md:text-base font-semibold">Espaços Disponíveis</h3>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowNewSpaceDialog(true)} 
              className="h-8 md:h-9 text-xs md:text-sm touch-manipulation"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Novo </span>Espaço
            </Button>
          </div>

          {spacesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando espaços...
            </div>
          ) : spaces.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-3">Nenhum espaço criado ainda</p>
              <Button onClick={() => setShowNewSpaceDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Espaço
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  className="p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: space.color?.startsWith('#') ? space.color : 'hsl(var(--primary))' }}
                      >
                        <Building2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{space.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{space.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 touch-manipulation"
                      onClick={() => setDeletingSpace(space)}
                      title="Excluir espaço"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Descriptions */}
        <div className="stat-card">
          <h3 className="text-sm md:text-base font-semibold mb-4">Níveis de Acesso</h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {AVAILABLE_ROLES.map((roleInfo) => (
              <div
                key={roleInfo.value}
                className="p-3 md:p-4 rounded-lg border bg-card"
              >
                <Badge
                  variant="outline"
                  className={cn("mb-2 text-xs", getRoleBadgeStyle(roleInfo.value))}
                >
                  {roleInfo.label}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {roleInfo.description}
                </p>
                {roleInfo.value === "admin" && (
                  <p className="text-[10px] md:text-xs text-primary mt-2 font-medium">
                    ✓ Acesso total automático
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SQL Info */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs md:text-sm">
            <strong>Nota:</strong> Para alterar roles de usuários, use o SQL Editor do Supabase 
            e modifique a tabela <code className="bg-muted px-1 rounded">user_roles</code>.
          </AlertDescription>
        </Alert>
      </div>

      {/* Create Space Dialog */}
      <Dialog open={showNewSpaceDialog} onOpenChange={setShowNewSpaceDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Espaço</DialogTitle>
            <DialogDescription>
              Adicione um novo espaço para organizar seus dados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spaceName">Nome do Espaço *</Label>
              <Input
                id="spaceName"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Ex: Minha Empresa"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spaceDescription">Descrição</Label>
              <Input
                id="spaceDescription"
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                placeholder="Ex: Empresa principal"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor do Espaço</Label>
              <Select value={newSpaceColor} onValueChange={setNewSpaceColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACE_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ background: color.value }}
                        />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSpaceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSpace} disabled={creatingSpace || !newSpaceName.trim()}>
              {creatingSpace ? "Criando..." : "Criar Espaço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Space Confirmation Dialog */}
      <Dialog open={!!deletingSpace} onOpenChange={() => setDeletingSpace(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir Espaço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o espaço "{deletingSpace?.label}"? 
              Esta ação não pode ser desfeita e todos os dados associados serão removidos.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingSpace(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSpace} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
