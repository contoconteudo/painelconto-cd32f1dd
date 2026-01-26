import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Objective, ObjectiveValueType } from "@/types";
import { ProgressLogForm } from "./ProgressLogForm";
import { ObjectiveForm } from "./ObjectiveForm";
import { Plus, Pencil, Trash2, TrendingUp, Target, Briefcase, Users, Clock } from "lucide-react";
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
  onAddProgress: (objectiveId: string, value: number, description: string) => void;
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

export function ObjectiveDetail({ 
  open, 
  onOpenChange, 
  objective, 
  onAddProgress, 
  onUpdate,
  onDelete 
}: ObjectiveDetailProps) {
  const [showProgressForm, setShowProgressForm] = useState(false);
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
            <div className="flex items-center gap-3">
              <Badge className={status.class}>{status.label}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Prazo: {new Date(objective.deadline).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Progress */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progresso</span>
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
              <Button 
                onClick={() => setShowProgressForm(true)} 
                className="flex-1 gradient-primary text-primary-foreground gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Registrar Progresso
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowEditForm(true)}>
                <Pencil className="h-4 w-4" />
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

            {/* Progress Logs */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Histórico de Progresso</h4>
              
              {objective.progressLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum registro de progresso ainda.</p>
                  <p className="text-xs mt-1">Clique em "Registrar Progresso" para adicionar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...objective.progressLogs].reverse().map((log) => (
                    <div key={log.id} className="p-3 rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {formatValue(log.value)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{log.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Progress Log Form */}
      <ProgressLogForm
        open={showProgressForm}
        onOpenChange={setShowProgressForm}
        objective={objective}
        onSubmit={(value, description) => onAddProgress(objective.id, value, description)}
      />

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
