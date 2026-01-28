import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { Shield, Edit2, Save, X, Users, AlertCircle, Info, Building2, Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUserRole, type AppRole, type ModulePermission, type CompanyAccess } from "@/hooks/useUserRole";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ALL_MODULES, DEFAULT_ROLE_PERMISSIONS, MockUser, getCompanies } from "@/data/mockData";
import { Separator } from "@/components/ui/separator";
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
  const { isAdmin, getAllUsers, updateUserPermissions, updateUserRole } = useUserRole();
  const { spaces, createSpace, deleteSpace, SPACE_COLORS } = useSpaces();
  
  const [users, setUsers] = useState<MockUser[]>([]);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("analista");
  const [selectedModules, setSelectedModules] = useState<ModulePermission[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyAccess[]>([]);
  const [saving, setSaving] = useState(false);

  // Estado para criar novo espaço
  const [showNewSpaceDialog, setShowNewSpaceDialog] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState(SPACE_COLORS[2].value); // Verde por padrão

  // Estado para confirmar exclusão de espaço
  const [deletingSpace, setDeletingSpace] = useState<Space | null>(null);

  // Carregar usuários
  useEffect(() => {
    setUsers(getAllUsers());
  }, [getAllUsers]);

  const handleEditUser = (user: MockUser) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedModules(user.modules);
    setSelectedCompanies(user.companies);
  };

  const handleRoleChange = (role: AppRole) => {
    setSelectedRole(role);
    // Sugerir permissões padrão da role (exceto para admin)
    if (role !== "admin") {
      setSelectedModules(DEFAULT_ROLE_PERMISSIONS[role].filter(m => m !== "admin"));
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Salvar permissões
    updateUserPermissions(editingUser.id, selectedModules, selectedCompanies);
    updateUserRole(editingUser.id, selectedRole);
    
    // Atualizar lista local
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, role: selectedRole, modules: selectedModules, companies: selectedCompanies }
          : u
      )
    );
    
    toast.success(`Permissões de ${editingUser.full_name} atualizadas!`);
    
    setSaving(false);
    setEditingUser(null);
  };

  const toggleModule = (moduleId: ModulePermission) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleCompany = (companyId: CompanyAccess) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((c) => c !== companyId)
        : [...prev, companyId]
    );
  };

  const selectAllModules = () => {
    setSelectedModules(ALL_MODULES.map((m) => m.id));
  };

  const clearAllModules = () => {
    setSelectedModules([]);
  };

  const selectAllCompanies = () => {
    setSelectedCompanies(spaces.map((c) => c.id));
  };

  // Handlers para gestão de espaços
  const handleCreateSpace = () => {
    const result = createSpace(newSpaceName, newSpaceDescription, newSpaceColor);
    
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

  const handleDeleteSpace = () => {
    if (!deletingSpace) return;
    
    const result = deleteSpace(deletingSpace.id);
    
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
      subtitle="Gerencie usuários, espaços e permissões do sistema"
    >
      <div className="space-y-4 md:space-y-6">
        {/* Info Card */}
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs md:text-sm">
            <strong>Como funciona:</strong> Administradores têm acesso total. 
            Para outros usuários, você controla quais <strong>espaços</strong> e <strong>módulos</strong> eles podem acessar.
          </AlertDescription>
        </Alert>

        {/* Users Section */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <h3 className="text-sm md:text-base font-semibold">Usuários do Sistema</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              {users.length} usuário(s)
            </Badge>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getRoleBadgeStyle(user.role))}
                      >
                        {user.role}
                      </Badge>
                      {user.role === "admin" ? (
                        <Badge variant="secondary" className="text-xs">Acesso Total</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {user.modules.length} módulo(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    disabled={user.role === "admin"}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Espaços</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(getRoleBadgeStyle(user.role))}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge variant="secondary" className="text-xs">
                          Todos
                        </Badge>
                      ) : user.companies.length === 0 ? (
                        <span className="text-xs text-destructive italic">
                          Nenhum
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.companies.map((company) => {
                            const companyInfo = spaces.find((c) => c.id === company);
                            return (
                              <Badge
                                key={company}
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  companyInfo?.color ? `${companyInfo.color.replace('bg-', 'bg-')}/10 border-${companyInfo.color.replace('bg-', '')}/30` : ""
                                )}
                              >
                                {companyInfo?.label || company}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge variant="secondary" className="text-xs">
                          Acesso Total
                        </Badge>
                      ) : user.modules.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          Nenhum
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.modules.slice(0, 2).map((module) => (
                            <Badge
                              key={module}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ALL_MODULES.find((m) => m.id === module)?.label || module}
                            </Badge>
                          ))}
                          {user.modules.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.modules.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        disabled={user.role === "admin"}
                        title={user.role === "admin" ? "Admins têm acesso total" : "Editar permissões"}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Spaces Overview */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <h3 className="text-sm md:text-base font-semibold">Espaços Disponíveis</h3>
            </div>
            <Button size="sm" onClick={() => setShowNewSpaceDialog(true)} className="h-8 md:h-9 text-xs md:text-sm touch-manipulation">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Novo </span>Espaço
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="p-3 md:p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      space.color
                    )}>
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
        </div>

        {/* Role Descriptions */}
        <div className="stat-card">
          <h3 className="text-sm md:text-base font-semibold mb-4">Níveis de Acesso</h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {AVAILABLE_ROLES.map((role) => (
              <div
                key={role.value}
                className="p-3 md:p-4 rounded-lg border bg-card"
              >
                <Badge
                  variant="outline"
                  className={cn("mb-2 text-xs", getRoleBadgeStyle(role.value))}
                >
                  {role.label}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {role.description}
                </p>
                {role.value === "admin" && (
                  <p className="text-[10px] md:text-xs text-primary mt-2 font-medium">
                    ✓ Acesso total automático
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Defina quais espaços e módulos este usuário pode acessar
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{editingUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role do Usuário</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => handleRoleChange(v as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma role" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.filter((r) => r.value !== "admin").map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              getRoleBadgeStyle(role.value)
                            )}
                          >
                            {role.label}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Company/Space Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Espaços Permitidos
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione quais espaços o usuário pode acessar
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllCompanies}
                    className="text-xs h-7"
                  >
                    Selecionar todos
                  </Button>
                </div>
                <div className="grid gap-2">
                  {spaces.map((company) => (
                    <div
                      key={company.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedCompanies.includes(company.id)
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-accent/5"
                      )}
                      onClick={() => toggleCompany(company.id)}
                    >
                      <Checkbox
                        id={`company-${company.id}`}
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                      />
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        company.color
                      )}>
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label
                          htmlFor={`company-${company.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {company.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {company.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedCompanies.length === 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Sem espaços selecionados, o usuário não poderá alternar entre empresas.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Module Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Módulos Permitidos</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione quais funcionalidades o usuário pode acessar
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllModules}
                      className="text-xs h-7"
                    >
                      Todos
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllModules}
                      className="text-xs h-7"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {ALL_MODULES.map((module) => (
                    <div
                      key={module.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedModules.includes(module.id)
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-accent/5"
                      )}
                      onClick={() => toggleModule(module.id)}
                    >
                      <Checkbox
                        id={module.id}
                        checked={selectedModules.includes(module.id)}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <div className="space-y-0.5 flex-1">
                        <Label
                          htmlFor={module.id}
                          className="font-medium cursor-pointer"
                        >
                          {module.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedModules.length === 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Sem módulos selecionados, o usuário não terá acesso a nenhuma funcionalidade.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Space Dialog */}
      <Dialog open={showNewSpaceDialog} onOpenChange={setShowNewSpaceDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Espaço</DialogTitle>
            <DialogDescription>
              Adicione um novo espaço de trabalho para organizar dados separadamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="space-name">Nome do Espaço *</Label>
              <Input
                id="space-name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Ex: Nova Agência"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="space-description">Descrição</Label>
              <Input
                id="space-description"
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                placeholder="Ex: Agência Nova Agência"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-4 gap-2">
                {SPACE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewSpaceColor(color.value)}
                    className={cn(
                      "h-10 rounded-lg flex items-center justify-center transition-all",
                      color.value,
                      newSpaceColor === color.value
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "opacity-70 hover:opacity-100"
                    )}
                    title={color.label}
                  >
                    <Building2 className="h-5 w-5 text-white" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSpaceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSpace} disabled={!newSpaceName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Espaço
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
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta ação não pode ser desfeita. Usuários com acesso apenas a este espaço perderão acesso ao sistema.
            </AlertDescription>
          </Alert>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingSpace(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSpace}>
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir Espaço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
