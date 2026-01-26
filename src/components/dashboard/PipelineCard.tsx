import { Flame, Thermometer, Snowflake } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { LeadStage } from "@/types";

const TemperatureIcon = ({ temp }: { temp: "hot" | "warm" | "cold" }) => {
  const icons = {
    hot: <Flame className="h-3 w-3 text-destructive" />,
    warm: <Thermometer className="h-3 w-3 text-warning" />,
    cold: <Snowflake className="h-3 w-3 text-primary" />,
  };
  return icons[temp];
};

const pipelineStages: { key: LeadStage; name: string }[] = [
  { key: "new", name: "Novo" },
  { key: "contact", name: "Contato" },
  { key: "proposal", name: "Proposta" },
  { key: "negotiation", name: "Negociação" },
];

export function PipelineCard() {
  const { getLeadsByStage, getPipelineStats } = useLeads();
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
        {pipelineStages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.key);
          const stageTotal = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

          return (
            <div key={stage.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{stage.name}</span>
                <span className="text-xs font-semibold text-foreground">
                  R$ {(stageTotal / 1000).toFixed(1)}k
                </span>
              </div>
              
              <div className="space-y-2">
                {stageLeads.slice(0, 2).map((lead) => (
                  <div
                    key={lead.id}
                    className="pipeline-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                      </div>
                      <TemperatureIcon temp={lead.temperature} />
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-primary">
                      R$ {lead.value.toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
                {stageLeads.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{stageLeads.length - 2} mais
                  </p>
                )}
                {stageLeads.length === 0 && (
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
