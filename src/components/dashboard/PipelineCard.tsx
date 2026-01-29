import { useLeads } from "@/hooks/useLeads";
import { LeadStatus } from "@/types";

const pipelineStatuses: { key: LeadStatus; name: string }[] = [
  { key: "novo", name: "Novo" },
  { key: "contato", name: "Contato" },
  { key: "proposta", name: "Proposta" },
  { key: "negociacao", name: "Negociação" },
];

export function PipelineCard() {
  const { leads, getLeadsByStatus, getPipelineStats } = useLeads();
  const stats = getPipelineStats();

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Pipeline Comercial</h3>
        <span className="text-sm font-semibold text-primary">
          R$ {stats.totalValue.toLocaleString('pt-BR')}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {pipelineStatuses.map((status) => {
          const statusLeads = getLeadsByStatus(status.key);
          const statusTotal = statusLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);

          return (
            <div key={status.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{status.name}</span>
                <span className="text-xs font-semibold text-foreground">
                  R$ {(statusTotal / 1000).toFixed(1)}k
                </span>
              </div>
              
              <div className="space-y-2">
                {statusLeads.slice(0, 2).map((lead) => (
                  <div
                    key={lead.id}
                    className="pipeline-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.company || "-"}</p>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-primary">
                      R$ {(lead.value || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
                {statusLeads.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{statusLeads.length - 2} mais
                  </p>
                )}
                {statusLeads.length === 0 && (
                  <div className="pipeline-card opacity-50">
                    <p className="text-xs text-muted-foreground text-center">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <a 
        href="/crm"
        className="mt-4 w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors block"
      >
        Ver pipeline completo →
      </a>
    </div>
  );
}
