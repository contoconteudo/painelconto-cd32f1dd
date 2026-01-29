import { useMemo, useState } from "react";
import { Objective, ProgressLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, Plus, Pencil, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatValue } from "@/lib/constants";
import { usePermissions } from "@/hooks/usePermissions";
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

interface MonthlyProgressGridProps {
  objective: Objective;
  onAddProgress: (value: number, notes?: string, loggedAt?: string) => void;
  onDeleteProgress: (logId: string) => void;
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const fullMonthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function MonthlyProgressGrid({ objective, onAddProgress, onDeleteProgress }: MonthlyProgressGridProps) {
  const { canDelete } = usePermissions();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ProgressLog | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const progressLogs = objective.progressLogs || [];
  
  const logsByMonth = useMemo(() => {
    return progressLogs.reduce((acc, log) => {
      const date = new Date(log.logged_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {} as Record<string, ProgressLog[]>);
  }, [progressLogs]);

  const monthTotals = useMemo(() => {
    return Array.from({ length: 12 }).map((_, monthIdx) => {
      const key = `${selectedYear}-${monthIdx}`;
      const logs = logsByMonth[key] || [];
      const total = logs.reduce((sum, l) => sum + (l.value || 0), 0);
      return { monthIdx, logs, total };
    });
  }, [logsByMonth, selectedYear]);
  
  const handleSave = () => {
    if (!editValue) return;

    const loggedAt =
      selectedMonthIndex === null
        ? undefined
        : new Date(selectedYear, selectedMonthIndex, 1, 12, 0, 0).toISOString();

    onAddProgress(parseFloat(editValue), editNotes || undefined, loggedAt);
    setShowAddDialog(false);
    setEditValue("");
    setEditNotes("");
    setSelectedMonthIndex(null);
  };

  const handleDeleteConfirm = () => {
    if (selectedLog) {
      onDeleteProgress(selectedLog.id);
      setShowDeleteAlert(false);
      setSelectedLog(null);
    }
  };
  
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Registros de Progresso</h4>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedMonthIndex(null);
              setShowAddDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Registrar
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {monthTotals.map(({ monthIdx, total, logs }) => {
            const isSelected = selectedMonthIndex === monthIdx;
            const hasLogs = logs.length > 0;
            return (
              <button
                key={monthIdx}
                type="button"
                onClick={() => {
                  setSelectedMonthIndex(monthIdx);
                  setShowAddDialog(true);
                }}
                className={cn(
                  "rounded-lg border p-2 text-left transition-colors hover:bg-muted/40",
                  isSelected && "ring-2 ring-primary",
                  hasLogs ? "bg-muted/20" : "bg-background"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{monthNames[monthIdx]}</span>
                  <span className="text-[10px] text-muted-foreground">{logs.length}x</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {hasLogs ? formatValue(total, objective.unit) : "—"}
                </div>
              </button>
            );
          })}
        </div>
        
        {progressLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum registro de progresso ainda.</p>
            <p className="text-xs mt-1">Clique em "Registrar" para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {progressLogs.slice().reverse().slice(0, 10).map((log) => {
              const date = new Date(log.logged_at);
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border bg-muted/30 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {formatValue(log.value, objective.unit)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fullMonthNames[date.getMonth()]} {date.getFullYear()}
                        </p>
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDeleteAlert(true);
                        }}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-2 ml-11">{log.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Add Progress Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Registrar Progresso
            </DialogTitle>
            <DialogDescription>
              {selectedMonthIndex === null
                ? "Adicione um novo registro de progresso para este objetivo."
                : `Adicionar registro para ${fullMonthNames[selectedMonthIndex]} de ${selectedYear}.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="progressValue">Valor</Label>
              <Input
                id="progressValue"
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Ex: 10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="progressNotes">Notas (opcional)</Label>
              <Textarea
                id="progressNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="O que foi conquistado?"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="gradient-primary text-primary-foreground"
              disabled={!editValue}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de progresso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
