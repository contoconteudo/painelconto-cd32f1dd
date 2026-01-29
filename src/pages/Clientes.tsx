import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Plus, Building2, Mail, Phone, MoreHorizontal, Star, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useClients, getLatestNPS } from "@/hooks/useClients";
import { usePermissions } from "@/hooks/usePermissions";
import { Client } from "@/types";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientDetail } from "@/components/clients/ClientDetail";
import { NPSQuickRegister } from "@/components/clients/NPSQuickRegister";
import { toast } from "sonner";
import { CLIENT_STATUSES, getNPSColor } from "@/lib/constants";

function NPSBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const colorClass = getNPSColor(score);

  return (
    <div className="flex items-center gap-1">
      <Star className={cn("h-3.5 w-3.5 fill-current", colorClass)} />
      <span className={cn("text-sm font-semibold", colorClass)}>{score}</span>
    </div>
  );
}

function calculateLTV(monthlyValue: number | null, contractStart: string | null): number {
  if (!monthlyValue || !contractStart) return 0;
  const start = new Date(contractStart);
  const now = new Date();
  const months = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return monthlyValue * months;
}

// Mobile client card component
function MobileClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const latestNPS = getLatestNPS(client.npsHistory || []);
  const statusConfig = CLIENT_STATUSES[client.status];
  
  return (
    <div 
      className="stat-card p-4 touch-manipulation active-press"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
            <p className="text-xs text-muted-foreground truncate">{client.company || client.segment || "-"}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={cn("text-xs", statusConfig?.className)}>
                {statusConfig?.label || client.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-bold text-foreground">R$ {((client.monthly_value || 0) / 1000).toFixed(1)}k</p>
          <NPSBadge score={latestNPS} />
          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const { clients, addClient, updateClient, deleteClient, addNPSRecord, deleteNPSRecord, getStats } = useClients();
  const { canDelete } = usePermissions();
  const stats = getStats();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");

  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [npsRegisterOpen, setNpsRegisterOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Get unique segments for filter
  const segments = useMemo(() => {
    const uniqueSegments = new Set(clients.map((c) => c.segment).filter(Boolean) as string[]);
    return Array.from(uniqueSegments).sort();
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesSegment = segmentFilter === "all" || client.segment === segmentFilter;

      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [clients, searchTerm, statusFilter, segmentFilter]);

  const hasActiveFilters = statusFilter !== "all" || segmentFilter !== "all";

  // Handlers
  const handleDeleteClient = () => {
    if (!selectedClient) return;
    deleteClient(selectedClient.id);
    setDeleteDialogOpen(false);
    setDetailOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteNPSRecord = (recordId: string) => {
    if (!selectedClient) return;
    deleteNPSRecord(selectedClient.id, recordId);
    const updatedClient = clients.find((c) => c.id === selectedClient.id);
    if (updatedClient) {
      setSelectedClient({
        ...updatedClient,
        npsHistory: (updatedClient.npsHistory || []).filter((r) => r.id !== recordId),
      });
    }
  };

  const handleAddNPSFromDetail = async (record: { score: number; feedback?: string }) => {
    if (!selectedClient) return;
    const created = await addNPSRecord(selectedClient.id, record);
    if (!created) return;

    setSelectedClient((prev) => {
      if (!prev) return prev;
      if (prev.id !== selectedClient.id) return prev;
      return {
        ...prev,
        npsHistory: [...(prev.npsHistory || []), created],
      };
    });
  };

  const openClientDetail = (client: Client) => {
    setSelectedClient(client);
    setDetailOpen(true);
  };

  const openEditForm = () => {
    setDetailOpen(false);
    setFormOpen(true);
  };

  const openDeleteDialog = () => {
    setDetailOpen(false);
    setDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSegmentFilter("all");
  };

  return (
    <AppLayout title="Clientes" subtitle="Gestão de carteira de clientes">
      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="stat-card">
          <p className="stat-label">Clientes Ativos</p>
          <p className="stat-value">{stats.activeCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">MRR Total</p>
          <p className="stat-value">R$ {(stats.totalMRR / 1000).toFixed(0)}k</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Ticket Médio</p>
          <p className="stat-value">R$ {(stats.avgTicket / 1000).toFixed(1)}k</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">NPS Médio</p>
          <p className="stat-value text-success">{stats.avgNPS}</p>
        </div>
      </div>

      {/* Toolbar - Responsive */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Search and Filters Row */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/50 border-border/60 h-9 text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] md:w-32 h-9 text-xs md:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
              <SelectItem value="churn">Churn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-[100px] md:w-36 h-9 text-xs md:text-sm">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {segments.map((seg) => (
                <SelectItem key={seg} value={seg}>{seg}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => setNpsRegisterOpen(true)} 
            className="gap-1.5 h-9 text-xs md:text-sm flex-1 sm:flex-initial touch-manipulation"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Registrar</span> NPS
          </Button>
          <Button 
            className="gradient-primary text-primary-foreground gap-1.5 h-9 text-xs md:text-sm flex-1 sm:flex-initial touch-manipulation" 
            onClick={() => {
              setSelectedClient(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filteredClients.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <MobileClientCard 
              key={client.id} 
              client={client} 
              onClick={() => openClientDetail(client)} 
            />
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Nome</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Empresa</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Valor/Mês</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">Último NPS</th>
                <th className="text-left text-xs font-semibold text-muted-foreground p-4">LTV</th>
                <th className="text-right text-xs font-semibold text-muted-foreground p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const latestNPS = getLatestNPS(client.npsHistory || []);
                const statusConfig = CLIENT_STATUSES[client.status];
                
                return (
                  <tr 
                    key={client.id} 
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => openClientDetail(client)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{client.company || "-"}</p>
                        <p className="text-xs text-muted-foreground">{client.segment || "-"}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-foreground">R$ {(client.monthly_value || 0).toLocaleString('pt-BR')}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={statusConfig?.className}>
                        {statusConfig?.label || client.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <NPSBadge score={latestNPS} />
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        R$ {calculateLTV(client.monthly_value, client.contract_start).toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {client.phone && (
                          <a href={`tel:${client.phone}`} className="p-2 rounded hover:bg-muted transition-colors">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                        {client.email && (
                          <a href={`mailto:${client.email}`} className="p-2 rounded hover:bg-muted transition-colors">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openClientDetail(client)}>
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedClient(client);
                              setFormOpen(true);
                            }}>
                              Editar
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ClientForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedClient(null);
        }}
        client={selectedClient}
        onSubmit={selectedClient ? (data) => updateClient(selectedClient.id, data) : addClient}
      />

      <ClientDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        client={selectedClient}
        onEdit={openEditForm}
        onDelete={openDeleteDialog}
        onAddNPSRecord={handleAddNPSFromDetail}
        onDeleteNPSRecord={handleDeleteNPSRecord}
      />

      <NPSQuickRegister
        open={npsRegisterOpen}
        onOpenChange={setNpsRegisterOpen}
        clients={clients}
        onAddNPS={addNPSRecord}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedClient?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
