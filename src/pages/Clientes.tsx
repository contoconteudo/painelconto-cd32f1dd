import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Plus, Building2, Mail, Phone, MoreHorizontal, Star, X } from "lucide-react";
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

function calculateLTV(monthlyValue: number, startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const months = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return monthlyValue * months;
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
    const uniqueSegments = new Set(clients.map((c) => c.segment));
    return Array.from(uniqueSegments).sort();
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesSegment = segmentFilter === "all" || client.segment === segmentFilter;

      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [clients, searchTerm, statusFilter, segmentFilter]);

  const hasActiveFilters = statusFilter !== "all" || segmentFilter !== "all";

  // Handlers
  const handleAddClient = (data: Omit<Client, "id" | "npsHistory">) => {
    addClient({ ...data, npsHistory: [] });
    toast.success("Cliente criado com sucesso!");
  };

  const handleUpdateClient = (data: Omit<Client, "id" | "npsHistory">) => {
    if (!selectedClient) return;
    updateClient(selectedClient.id, data);
    toast.success("Cliente atualizado com sucesso!");
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    deleteClient(selectedClient.id);
    toast.success("Cliente excluído com sucesso!");
    setDeleteDialogOpen(false);
    setDetailOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteNPSRecord = (recordId: string) => {
    if (!selectedClient) return;
    deleteNPSRecord(selectedClient.id, recordId);
    // Update the selected client in state to reflect the change
    const updatedClient = clients.find((c) => c.id === selectedClient.id);
    if (updatedClient) {
      setSelectedClient({
        ...updatedClient,
        npsHistory: updatedClient.npsHistory.filter((r) => r.id !== recordId),
      });
    }
    toast.success("Registro de NPS excluído!");
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Clientes Ativos</p>
          <p className="stat-value">{stats.activeCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">MRR Total</p>
          <p className="stat-value">R$ {stats.totalMRR.toLocaleString('pt-BR')}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Ticket Médio</p>
          <p className="stat-value">R$ {stats.avgTicket.toLocaleString('pt-BR')}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">NPS Médio</p>
          <p className="stat-value text-success">{stats.avgNPS}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9 bg-muted/50 border-border/60"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="churn">Churn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-36">
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
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setNpsRegisterOpen(true)} className="gap-1.5">
            <Star className="h-4 w-4" />
            Registrar NPS
          </Button>
          <Button className="gradient-primary text-primary-foreground gap-1.5" onClick={() => {
            setSelectedClient(null);
            setFormOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="stat-card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Empresa</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Contato</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Pacote</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Valor/Mês</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Status</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">Último NPS</th>
              <th className="text-left text-xs font-semibold text-muted-foreground p-4">LTV</th>
              <th className="text-right text-xs font-semibold text-muted-foreground p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              const latestNPS = getLatestNPS(client.npsHistory);
              
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
                        <p className="text-sm font-semibold text-foreground">{client.company}</p>
                        <p className="text-xs text-muted-foreground">{client.segment}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.contact}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className="font-medium">{client.package}</Badge>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-semibold text-foreground">R$ {client.monthlyValue.toLocaleString('pt-BR')}</p>
                  </td>
                  <td className="p-4">
                    <Badge className={CLIENT_STATUSES[client.status].className}>
                      {CLIENT_STATUSES[client.status].label}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <NPSBadge score={latestNPS} />
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">R$ {calculateLTV(client.monthlyValue, client.startDate).toLocaleString('pt-BR')}</p>
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`tel:${client.phone}`} className="p-2 rounded hover:bg-muted transition-colors">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <a href={`mailto:${client.email}`} className="p-2 rounded hover:bg-muted transition-colors">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </a>
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
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ClientForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedClient(null);
        }}
        client={selectedClient}
        onSubmit={selectedClient ? handleUpdateClient : handleAddClient}
      />

      <ClientDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        client={selectedClient}
        onEdit={openEditForm}
        onDelete={openDeleteDialog}
        onDeleteNPSRecord={handleDeleteNPSRecord}
      />

      <NPSQuickRegister
        open={npsRegisterOpen}
        onOpenChange={setNpsRegisterOpen}
        clients={clients}
        onAddNPS={addNPSRecord}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selectedClient?.company}"? Esta ação não pode ser desfeita.
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
