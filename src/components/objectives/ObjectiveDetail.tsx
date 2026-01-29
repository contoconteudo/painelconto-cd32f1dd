import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Objective } from "@/types";
import { ObjectiveForm } from "./ObjectiveForm";
import { Pencil, Trash2, Target, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { OBJECTIVE_STATUSES, formatValue } from "@/lib/constants";
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
  onAddProgress: (objectiveId: string, value: number, notes?: string) => void;
  onUpdate: (id: string, data: Partial<Objective>) => void;
  onDelete: (id: string) => void;
}

export function ObjectiveDetail({ 
  open, 
  onOpenChange, 
  objective, 
  onAddProgress,
  onUpdate,
  onDelete 
}: ObjectiveDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!objective) return null;

  const statusConfig = OBJECTIVE_STATUSES[objective.status];
  const progress = objective.target_value 
    ? Math.round((objective.current_value / objective.target_value) * 100) 
    : 0;

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
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold leading-tight mb-1">
                  {objective.title}
                </SheetTitle>
                <SheetDescription>{objective.description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Status & Category */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={statusConfig?.className}>
                {statusConfig?.label || objective.status}
              </Badge>
              {objective.category && (
                <Badge variant="secondary">{objective.category}</Badge>
              )}
              {objective.end_date && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Prazo: {new Date(objective.end_date).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>

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
                    statusConfig?.barColor || "bg-primary"
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Atual: {formatValue(objective.current_value, objective.unit)}
                </span>
                <span className="font-medium">
                  Meta: {formatValue(objective.target_value || 0, objective.unit)}
                </span>
              </div>
            </div>

            {/* Progress Logs */}
            {objective.progressLogs && objective.progressLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Histórico de Progresso</h4>
                <div className="space-y-2">
                  {objective.progressLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-muted/30 border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {formatValue(log.value, objective.unit)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.logged_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              Tem certeza que deseja excluir "{objective.title}"? Esta ação não pode ser desfeita.
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
