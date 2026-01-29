import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, Phone, Mail, Filter, X, ChevronRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetail } from "@/components/crm/LeadDetail";
import { Lead, LeadStatus } from "@/types";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LEAD_STATUSES, LEAD_SOURCES, PIPELINE_STATUSES } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";

function LeadCard({ 
  lead, 
  onClick,
  onDragStart,
  onDragEnd,
  isDragging 
}: { 
  lead: Lead; 
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  return (
    <div 
      className={cn(
        "bg-card rounded-lg p-3 border border-border/60 shadow-sm transition-all duration-200 cursor-pointer group touch-manipulation active-press",
        isDragging && "opacity-50 ring-2 ring-primary",
        "hover:shadow-md hover:border-border md:cursor-grab"
      )}
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
          <p className="text-xs text-muted-foreground truncate">{lead.company || "-"}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        {lead.source && (
          <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
            {lead.source}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">
          R$ {(lead.value || 0).toLocaleString('pt-BR')}
        </p>
        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {lead.phone && (
            <a 
              href={`tel:${lead.phone}`}
              className="p-2 rounded hover:bg-muted transition-colors touch-manipulation"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
          {lead.email && (
            <a 
              href={`mailto:${lead.email}`}
              className="p-2 rounded hover:bg-muted transition-colors touch-manipulation"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Lead Card for list view
function MobileLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const statusConfig = LEAD_STATUSES[lead.status];
  
  return (
    <div 
      className="stat-card p-4 touch-manipulation active-press"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{lead.company || "-"}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium",
              statusConfig?.color || "bg-muted",
              "text-foreground"
            )}>
              {statusConfig?.name || lead.status}
            </span>
            {lead.source && (
              <span className="text-[10px] text-muted-foreground">{lead.source}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-sm font-bold text-primary">
            R$ {((lead.value || 0) / 1000).toFixed(0)}k
          </p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const isMobile = useIsMobile();
  const { leads, addLead, updateLead, deleteLead, moveLeadToStatus, getLeadsByStatus, getPipelineStats } = useLeads();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormStatus, setCreateFormStatus] = useState<LeadStatus>("novo");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);
  
  // Filters
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [showWonLeads, setShowWonLeads] = useState(true);
  const [showLostLeads, setShowLostLeads] = useState(true);

  // Get unique sources from leads
  const uniqueSources = useMemo(() => {
    const sources = new Set(leads.map(lead => lead.source).filter(Boolean) as string[]);
    return Array.from(sources).sort();
  }, [leads]);

  // Check if any filter is active
  const hasActiveFilters = sourceFilter !== "all" || statusFilter !== "all" || !showWonLeads || !showLostLeads;

  const clearFilters = () => {
    setSourceFilter("all");
    setStatusFilter("all");
    setShowWonLeads(true);
    setShowLostLeads(true);
  };

  // Filtrar status visíveis baseado nos toggles
  const visiblePipelineStatuses = useMemo(() => {
    return PIPELINE_STATUSES.filter(status => {
      if (status === "ganho" && !showWonLeads) return false;
      if (status === "perdido" && !showLostLeads) return false;
      return true;
    });
  }, [showWonLeads, showLostLeads]);

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId) {
      const lead = leads.find(l => l.id === draggedLeadId);
      if (lead && lead.status !== status) {
        moveLeadToStatus(draggedLeadId, status);
        const statusConfig = LEAD_STATUSES[status];
        toast.success(`Lead movido para ${statusConfig?.name || status}`, {
          description: `${lead.name} foi movido com sucesso.`,
        });
      }
    }
    setDraggedLeadId(null);
    setDragOverStatus(null);
  };

  const stats = getPipelineStats();

  // Filter leads by status with additional filters
  const getFilteredLeadsByStatus = (status: LeadStatus) => {
    let statusLeads = getLeadsByStatus(status);
    
    if (sourceFilter !== "all") {
      statusLeads = statusLeads.filter(lead => lead.source === sourceFilter);
    }
    
    return statusLeads;
  };

  // All filtered leads for mobile list view
  const filteredLeads = useMemo(() => {
    let filtered = leads;
    
    if (sourceFilter !== "all") {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Aplicar filtros de ganho/perdido
    if (!showWonLeads) {
      filtered = filtered.filter(lead => lead.status !== "ganho");
    }
    if (!showLostLeads) {
      filtered = filtered.filter(lead => lead.status !== "perdido");
    }
    
    return filtered;
  }, [leads, sourceFilter, statusFilter, showWonLeads, showLostLeads]);

  const handleAddClick = (status: LeadStatus) => {
    setCreateFormStatus(status);
    setShowCreateForm(true);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetail(true);
  };

  return (
    <AppLayout title="CRM" subtitle="Pipeline de vendas">
      {/* Header Stats - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-2 sm:pb-0">
          <div className="flex-shrink-0">
            <p className="text-xs md:text-sm text-muted-foreground">Total Pipeline</p>
            <p className="text-lg md:text-2xl font-bold text-foreground">R$ {(stats.totalValue / 1000).toFixed(0)}k</p>
          </div>
          <div className="h-8 md:h-10 w-px bg-border flex-shrink-0" />
          <div className="flex-shrink-0">
            <p className="text-xs md:text-sm text-muted-foreground">Leads Ativos</p>
            <p className="text-lg md:text-2xl font-bold text-foreground">{stats.inNegotiation}</p>
          </div>
          <div className="h-8 md:h-10 w-px bg-border flex-shrink-0" />
          <div className="flex-shrink-0">
            <p className="text-xs md:text-sm text-muted-foreground">Conversão</p>
            <p className="text-lg md:text-2xl font-bold text-success">{stats.conversionRate}%</p>
          </div>
        </div>
        <Button 
          onClick={() => handleAddClick("novo")} 
          className="gradient-primary text-primary-foreground gap-1.5 sm:w-auto touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Filters - Responsive */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          
          {/* Status filter */}
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
          >
            <SelectTrigger className="w-[120px] md:w-[140px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas etapas</SelectItem>
              {PIPELINE_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{LEAD_STATUSES[status]?.name || status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[100px] md:w-[160px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueSources.map((source) => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Limpar</span>
            </Button>
          )}
        </div>

        {/* Show/Hide Won and Lost Leads */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-won"
              checked={showWonLeads}
              onCheckedChange={setShowWonLeads}
              className="h-5 w-9"
            />
            <Label htmlFor="show-won" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5">
              {showWonLeads ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Ganhos
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-lost"
              checked={showLostLeads}
              onCheckedChange={setShowLostLeads}
              className="h-5 w-9"
            />
            <Label htmlFor="show-lost" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5">
              {showLostLeads ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Perdidos
            </Label>
          </div>
        </div>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="stat-card text-center py-8">
            <p className="text-muted-foreground">Nenhum lead encontrado</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <MobileLeadCard 
              key={lead.id} 
              lead={lead} 
              onClick={() => handleLeadClick(lead)} 
            />
          ))
        )}
      </div>

      {/* Desktop Kanban Board */}
      <div className="hidden md:flex gap-4 overflow-x-auto overflow-y-auto pb-4 max-h-[calc(100vh-280px)]">
        {visiblePipelineStatuses.map((statusKey) => {
          const config = LEAD_STATUSES[statusKey];
          const statusLeads = getFilteredLeadsByStatus(statusKey);
          const statusTotal = statusLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
          
          return (
            <div key={statusKey} className="flex-shrink-0 w-72">
              {/* Status Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", config?.color || "bg-muted")} />
                  <h3 className="text-sm font-semibold text-foreground">{config?.name || statusKey}</h3>
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {statusLeads.length}
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  R$ {(statusTotal / 1000).toFixed(1)}k
                </span>
              </div>

              {/* Cards */}
              <div 
                className={cn(
                  "space-y-2 min-h-[200px] max-h-[calc(100vh-360px)] overflow-y-auto p-2 rounded-lg bg-muted/30 transition-all duration-200",
                  dragOverStatus === statusKey && "ring-2 ring-primary bg-primary/10"
                )}
                onDragOver={(e) => handleDragOver(e, statusKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, statusKey)}
              >
                {statusLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onClick={() => handleLeadClick(lead)}
                    onDragStart={() => handleDragStart(lead.id)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedLeadId === lead.id}
                  />
                ))}
                <button 
                  onClick={() => handleAddClick(statusKey)}
                  className="w-full p-2 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Form */}
      <LeadForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
        defaultStatus={createFormStatus}
        onSubmit={addLead}
      />

      {/* Detail Sheet */}
      <LeadDetail
        open={showDetail}
        onOpenChange={setShowDetail}
        lead={selectedLead}
        onUpdate={updateLead}
        onDelete={deleteLead}
        onMoveToStatus={moveLeadToStatus}
      />
    </AppLayout>
  );
}
