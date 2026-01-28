import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Objective, ObjectiveValueType, CommercialDataSource } from "@/types";
import { MonthlyProgressGrid } from "./MonthlyProgressGrid";
import { ObjectiveForm } from "./ObjectiveForm";
import { Pencil, Trash2, TrendingUp, Target, Briefcase, Clock, Database, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ObjectiveDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective | null;
  onAddProgress: (objectiveId: string, month: number, year: number, value: number, description: string) => void;
  onUpdateProgress: (objectiveId: string, month: number, year: number, value: number, description: string) => void;
  onDeleteProgress: (objectiveId: string, month: number, year: number) => void;
  onUpdate: (id: string, data: Partial<Objective>) => void;
  onDelete: (id: string) => void;
}

const typeIcons = {
  financial: TrendingUp,
  quantity: Target,
  percentage: Briefcase,
};

const statusConfig = {
  on_track: { label: "No Prazo", class: "bg-success/10 text-success border-success/20" },
  at_risk: { label: "Em Risco", class: "bg-warning/10 text-warning border-warning/20" },
  behind: { label: "Atrasado", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

const valueTypeConfig: Record<ObjectiveValueType, { prefix: string; suffix: string }> = {
  financial: { prefix: "R$ ", suffix: "" },
  quantity: { prefix: "", suffix: "" },
  percentage: { prefix: "", suffix: "%" },
};

const dataSourceLabels: Record<CommercialDataSource, { label: string; icon: typeof TrendingUp }> = {
  crm: { label: "CRM", icon: TrendingUp },
  clients: { label: "Clientes", icon: Users },
};

export function ObjectiveDetail({ 
  open, 
  onOpenChange, 
  objective, 
  onAddProgress, 
  onUpdateProgress,
  onDeleteProgress,
  onUpdate,
  onDelete 
}: ObjectiveDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!objective) return null;

  const Icon = typeIcons[objective.valueType] || Target;
  const status = statusConfig[objective.status];
  const valueConfig = valueTypeConfig[objective.valueType];
  const progress = Math.round((objective.currentValue / objective.targetValue) * 100);

  const formatValue = (value: number) => {
    return `${valueConfig.prefix}${value.toLocaleString('pt-BR')}${valueConfig.suffix}`;
  };

  const handleDelete = () => {
    onDelete(objective.id);
    setShowDeleteAlert(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold leading-tight mb-1">
                  {objective.name}
                </SheetTitle>
                <SheetDescription>{objective.description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Status & Deadline */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={status.class}>{status.label}</Badge>
              {objective.isCommercial && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
                  <Database className="h-3 w-3" />
                  Automática
                </Badge>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Prazo: {new Date(objective.deadline).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Commercial Data Sources Info */}
            {objective.isCommercial && objective.dataSources.length > 0 && (
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Fontes de dados
                </p>
                <div className="flex gap-2">
                  {objective.dataSources.map((source) => {
                    const SourceIcon = dataSourceLabels[source].icon;
                    return (
                      <Badge key={source} variant="secondary" className="gap-1">
                        <SourceIcon className="h-3 w-3" />
                        {dataSourceLabels[source].label}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  O valor atual é calculado automaticamente a partir dos dados selecionados.
                </p>
              </div>
            )}

            {/* Progress */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progresso Total</span>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    objective.status === "on_track" ? "bg-success" :
                    objective.status === "at_risk" ? "bg-warning" : "bg-destructive"
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Atual: {formatValue(objective.currentValue)}</span>
                <span className="font-medium">Meta: {formatValue(objective.targetValue)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditForm(true)}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Editar Objetivo
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Monthly Progress Grid - only for non-commercial objectives */}
            {!objective.isCommercial && (
              <MonthlyProgressGrid
                objective={objective}
                onAddProgress={(month, year, value, description) => 
                  onAddProgress(objective.id, month, year, value, description)
                }
                onUpdateProgress={(month, year, value, description) => 
                  onUpdateProgress(objective.id, month, year, value, description)
                }
                onDeleteProgress={(month, year) => 
                  onDeleteProgress(objective.id, month, year)
                }
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Form */}
      <ObjectiveForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        mode="edit"
        objective={objective}
        onSubmit={(data) => {
          onUpdate(objective.id, data);
          setShowEditForm(false);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Objetivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{objective.name}"? Esta ação não pode ser desfeita e todo o histórico de progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
