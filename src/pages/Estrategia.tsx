import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Target, TrendingUp, Calendar, Briefcase, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useObjectives } from "@/hooks/useObjectives";
import { ObjectiveForm } from "@/components/objectives/ObjectiveForm";
import { ObjectiveDetail } from "@/components/objectives/ObjectiveDetail";
import { Objective, ObjectiveValueType } from "@/types";

const typeIcons: Record<ObjectiveValueType, typeof TrendingUp> = {
  financial: TrendingUp,
  quantity: Target,
  percentage: Briefcase,
};

const statusColors = {
  on_track: { bg: "bg-success/10", text: "text-success", bar: "bg-success" },
  at_risk: { bg: "bg-warning/10", text: "text-warning", bar: "bg-warning" },
  behind: { bg: "bg-destructive/10", text: "text-destructive", bar: "bg-destructive" },
};

const statusLabels = {
  on_track: "No prazo",
  at_risk: "Em risco",
  behind: "Atrasado",
};

const valueTypeConfig: Record<ObjectiveValueType, { prefix: string; suffix: string }> = {
  financial: { prefix: "R$ ", suffix: "" },
  quantity: { prefix: "", suffix: "" },
  percentage: { prefix: "", suffix: "%" },
};

export default function Estrategia() {
  const { objectives, addObjective, updateObjective, deleteObjective, addProgressLog, getProgress, getStats } = useObjectives();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const stats = getStats();

  const formatValue = (value: number, valueType: ObjectiveValueType) => {
    const config = valueTypeConfig[valueType];
    return `${config.prefix}${value.toLocaleString('pt-BR')}${config.suffix}`;
  };

  const handleObjectiveClick = (objective: Objective) => {
    setSelectedObjective(objective);
    setShowDetail(true);
  };

  return (
    <AppLayout title="Planejamento Estratégico" subtitle="OKRs e metas anuais">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Objetivos</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">No Prazo</p>
              <p className="stat-value text-success">{stats.onTrack}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Em Risco</p>
              <p className="stat-value text-warning">{stats.atRisk}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Atrasados</p>
              <p className="stat-value text-destructive">{stats.behind}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Objetivos Estratégicos</h2>
        <Button onClick={() => setShowCreateForm(true)} className="gradient-primary text-primary-foreground gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Objetivo
        </Button>
      </div>

      {/* Objectives List */}
      <div className="space-y-4">
        {objectives.length === 0 ? (
          <div className="stat-card text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum objetivo cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece criando seu primeiro objetivo estratégico para acompanhar o progresso.
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="gradient-primary text-primary-foreground gap-1.5">
              <Plus className="h-4 w-4" />
              Criar Objetivo
            </Button>
          </div>
        ) : (
          objectives.map((obj) => {
            const Icon = typeIcons[obj.valueType];
            const colors = statusColors[obj.status];
            const progress = getProgress(obj);

            return (
              <div 
                key={obj.id} 
                className="stat-card group cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => handleObjectiveClick(obj)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0", colors.bg, colors.text)}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{obj.name}</h3>
                        <p className="text-sm text-muted-foreground">{obj.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", colors.bg, colors.text)}>
                          {statusLabels[obj.status]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(obj.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-12 text-right">{progress}%</span>
                    </div>

                    {/* Current vs Target */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Atual: {formatValue(obj.currentValue, obj.valueType)}</span>
                      <span>/</span>
                      <span className="font-medium text-foreground">Meta: {formatValue(obj.targetValue, obj.valueType)}</span>
                      {obj.progressLogs.length > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{obj.progressLogs.length} registro(s) de progresso</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Form */}
      <ObjectiveForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        mode="create"
        onSubmit={addObjective}
      />

      {/* Detail Sheet */}
      <ObjectiveDetail
        open={showDetail}
        onOpenChange={setShowDetail}
        objective={selectedObjective}
        onAddProgress={addProgressLog}
        onUpdate={updateObjective}
        onDelete={deleteObjective}
      />
    </AppLayout>
  );
}
