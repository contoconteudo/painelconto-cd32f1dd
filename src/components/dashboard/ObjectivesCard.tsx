import { Target, TrendingUp, Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useObjectives } from "@/hooks/useObjectives";
import { ObjectiveValueType } from "@/types";

const typeIcons: Record<ObjectiveValueType, typeof TrendingUp> = {
  financial: TrendingUp,
  quantity: Target,
  percentage: Briefcase,
};

const statusColors = {
  on_track: "bg-success",
  at_risk: "bg-warning",
  behind: "bg-destructive",
};

const valueTypeConfig: Record<ObjectiveValueType, { prefix: string; suffix: string }> = {
  financial: { prefix: "R$ ", suffix: "" },
  quantity: { prefix: "", suffix: "" },
  percentage: { prefix: "", suffix: "%" },
};

export function ObjectivesCard() {
  const { objectives, getProgress } = useObjectives();
  
  // Show only the first 4 objectives
  const displayObjectives = objectives.slice(0, 4);

  const formatValue = (value: number, valueType: ObjectiveValueType) => {
    const config = valueTypeConfig[valueType];
    if (valueType === "financial") {
      return `${config.prefix}${(value / 1000).toFixed(0)}k${config.suffix}`;
    }
    return `${config.prefix}${value.toLocaleString('pt-BR')}${config.suffix}`;
  };

  if (objectives.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Objetivos Estratégicos</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum objetivo cadastrado</p>
          <p className="text-xs mt-1">Acesse Estratégia para criar objetivos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Objetivos Estratégicos</h3>
        <span className="text-xs font-medium text-muted-foreground">
          {new Date().getFullYear()}
        </span>
      </div>

      <div className="space-y-4">
        {displayObjectives.map((objective) => {
          const Icon = typeIcons[objective.valueType];
          const progress = getProgress(objective);

          return (
            <div key={objective.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{objective.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatValue(objective.currentValue, objective.valueType)}
                    </span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xs font-medium text-foreground">
                      {formatValue(objective.targetValue, objective.valueType)}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">{progress}%</span>
              </div>
              
              <div className="ml-11 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", statusColors[objective.status])}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <a 
        href="/estrategia"
        className="mt-4 w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors block"
      >
        Ver planejamento completo →
      </a>
    </div>
  );
}
