import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Flame, Thermometer, Snowflake, Plus, Phone, Mail, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetail } from "@/components/crm/LeadDetail";
import { Lead, LeadStage } from "@/types";

const stageConfig: Record<LeadStage, { name: string; color: string }> = {
  new: { name: "Novo", color: "bg-muted-foreground" },
  contact: { name: "Contato Realizado", color: "bg-primary" },
  proposal: { name: "Proposta Enviada", color: "bg-warning" },
  negotiation: { name: "Negociação", color: "bg-success" },
  won: { name: "Ganho", color: "bg-success" },
  lost: { name: "Perdido", color: "bg-destructive" },
};

const TemperatureIcon = ({ temp }: { temp: "hot" | "warm" | "cold" }) => {
  const config = {
    hot: { icon: Flame, class: "text-destructive" },
    warm: { icon: Thermometer, class: "text-warning" },
    cold: { icon: Snowflake, class: "text-primary" },
  };
  const { icon: Icon, class: className } = config[temp];
  return <Icon className={cn("h-3.5 w-3.5", className)} />;
};

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
  const daysSinceContact = Math.floor(
    (new Date().getTime() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const lastContactText = daysSinceContact === 0 ? "Hoje" : 
    daysSinceContact === 1 ? "Ontem" : 
    `${daysSinceContact} dias`;

  return (
    <div 
      className={cn(
        "bg-card rounded-lg p-3 border border-border/60 shadow-sm hover:shadow-md hover:border-border transition-all duration-200 cursor-grab group",
        isDragging && "opacity-50 cursor-grabbing ring-2 ring-primary"
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
          <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
        </div>
        <TemperatureIcon temp={lead.temperature} />
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        {lead.origin && (
          <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground">
            {lead.origin}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">• {lastContactText}</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">
          R$ {lead.value.toLocaleString('pt-BR')}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {lead.phone && (
            <button 
              className="p-1.5 rounded hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${lead.phone}`);
              }}
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {lead.email && (
            <button 
              className="p-1.5 rounded hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`mailto:${lead.email}`);
              }}
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const { leads, addLead, updateLead, deleteLead, moveLeadToStage, getLeadsByStage, getPipelineStats } = useLeads();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormStage, setCreateFormStage] = useState<LeadStage>("new");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    if (draggedLeadId) {
      moveLeadToStage(draggedLeadId, stage);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const stats = getPipelineStats();
  
  // Show only active stages in the pipeline (exclude 'lost')
  const pipelineStages: LeadStage[] = ["new", "contact", "proposal", "negotiation", "won"];

  const handleAddClick = (stage: LeadStage) => {
    setCreateFormStage(stage);
    setShowCreateForm(true);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetail(true);
  };

  return (
    <AppLayout title="CRM" subtitle="Pipeline de vendas">
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Total no Pipeline</p>
            <p className="text-2xl font-bold text-foreground">R$ {stats.totalValue.toLocaleString('pt-BR')}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Leads Ativos</p>
            <p className="text-2xl font-bold text-foreground">{stats.inNegotiation}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Taxa Conversão</p>
            <p className="text-2xl font-bold text-success">{stats.conversionRate}%</p>
          </div>
        </div>
        <Button onClick={() => handleAddClick("new")} className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stageKey) => {
          const config = stageConfig[stageKey];
          const stageLeads = getLeadsByStage(stageKey);
          const stageTotal = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
          
          return (
            <div key={stageKey} className="flex-shrink-0 w-72">
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", config.color)} />
                  <h3 className="text-sm font-semibold text-foreground">{config.name}</h3>
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  R$ {(stageTotal / 1000).toFixed(1)}k
                </span>
              </div>

              {/* Cards */}
              <div 
                className={cn(
                  "space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 transition-all duration-200",
                  dragOverStage === stageKey && "ring-2 ring-primary bg-primary/10"
                )}
                onDragOver={(e) => handleDragOver(e, stageKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stageKey)}
              >
                {stageLeads.map((lead) => (
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
                  onClick={() => handleAddClick(stageKey)}
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
        defaultStage={createFormStage}
        onSubmit={addLead}
      />

      {/* Detail Sheet */}
      <LeadDetail
        open={showDetail}
        onOpenChange={setShowDetail}
        lead={selectedLead}
        onUpdate={updateLead}
        onDelete={deleteLead}
        onMoveToStage={moveLeadToStage}
      />
    </AppLayout>
  );
}
