import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Target, TrendingUp, Calendar, Briefcase, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useObjectives } from "@/hooks/useObjectives";
import { ObjectiveForm } from "@/components/objectives/ObjectiveForm";
import { ObjectiveDetail } from "@/components/objectives/ObjectiveDetail";
import { Objective } from "@/types";
import { OBJECTIVE_STATUSES, formatValue } from "@/lib/constants";

export default function Estrategia() {
  const { objectives, addObjective, updateObjective, deleteObjective, addProgressLog, deleteProgressLog, getProgress, getStats } = useObjectives();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const stats = getStats();

  const handleObjectiveClick = (objective: Objective) => {
    setSelectedObjective(objective);
    setShowDetail(true);
  };

  return (
    <AppLayout title="Planejamento Estratégico" subtitle="OKRs e metas anuais">
      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="stat-label">Objetivos</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Target className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="stat-label">Em Andamento</p>
              <p className="stat-value text-primary">{stats.emAndamento}</p>
            </div>
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="stat-label">Concluídos</p>
              <p className="stat-value text-success">{stats.concluido}</p>
            </div>
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-success/10 text-success flex-shrink-0">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="stat-label">Atrasados</p>
              <p className="stat-value text-destructive">{stats.atrasado}</p>
            </div>
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive flex-shrink-0">
              <Briefcase className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-foreground">Objetivos Estratégicos</h2>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          className="gradient-primary text-primary-foreground gap-1.5 sm:w-auto touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          Novo Objetivo
        </Button>
      </div>

      {/* Objectives List */}
      <div className="space-y-3 md:space-y-4">
        {objectives.length === 0 ? (
          <div className="stat-card text-center py-8 md:py-12">
            <Target className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">Nenhum objetivo cadastrado</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              Comece criando seu primeiro objetivo estratégico para acompanhar o progresso.
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="gradient-primary text-primary-foreground gap-1.5 touch-manipulation">
              <Plus className="h-4 w-4" />
              Criar Objetivo
            </Button>
          </div>
        ) : (
          objectives.map((obj) => {
            const statusConfig = OBJECTIVE_STATUSES[obj.status];
            const progress = getProgress(obj);

            return (
              <div 
                key={obj.id} 
                className="stat-card group cursor-pointer touch-manipulation active-press"
                onClick={() => handleObjectiveClick(obj)}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={cn(
                    "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl flex-shrink-0", 
                    statusConfig?.className || "bg-primary/10 text-primary"
                  )}>
                    <Target className="h-5 w-5 md:h-6 md:w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Mobile layout */}
                    <div className="md:hidden">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{obj.title}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", statusConfig?.className)}>
                          {statusConfig?.label || obj.status}
                        </span>
                        {obj.end_date && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(obj.end_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", statusConfig?.barColor || "bg-primary")}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{progress}%</span>
                      </div>
                      
                      <div className="text-[10px] text-muted-foreground">
                        {formatValue(obj.current_value, obj.unit)} / {formatValue(obj.target_value || 0, obj.unit)}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:block">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{obj.title}</h3>
                          <p className="text-sm text-muted-foreground">{obj.description}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusConfig?.className)}>
                            {statusConfig?.label || obj.status}
                          </span>
                          {obj.end_date && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(obj.end_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", statusConfig?.barColor || "bg-primary")}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground w-12 text-right">{progress}%</span>
                      </div>

                      {/* Current vs Target */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>Atual: {formatValue(obj.current_value, obj.unit)}</span>
                        <span>/</span>
                        <span className="font-medium text-foreground">Meta: {formatValue(obj.target_value || 0, obj.unit)}</span>
                        {obj.progressLogs && obj.progressLogs.length > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{obj.progressLogs.length} registro(s) de progresso</span>
                          </>
                        )}
                      </div>
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
        onAddProgress={(id, value, notes) => addProgressLog(id, value, notes)}
        onUpdate={updateObjective}
        onDelete={deleteObjective}
      />
    </AppLayout>
  );
}
