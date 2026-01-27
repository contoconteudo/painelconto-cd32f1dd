import { useState } from "react";
import { Objective, ObjectiveValueType, ProgressLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, Plus, Pencil, Calendar, Trash2 } from "lucide-react";
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

interface MonthlyProgressGridProps {
  objective: Objective;
  onAddProgress: (month: number, year: number, value: number, description: string) => void;
  onUpdateProgress: (month: number, year: number, value: number, description: string) => void;
  onDeleteProgress: (month: number, year: number) => void;
}

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const fullMonthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const valueTypeConfig: Record<ObjectiveValueType, { prefix: string; suffix: string }> = {
  financial: { prefix: "R$ ", suffix: "" },
  quantity: { prefix: "", suffix: "" },
  percentage: { prefix: "", suffix: "%" },
};

interface MonthData {
  month: number;
  year: number;
  log?: ProgressLog;
  isPast: boolean;
  isCurrent: boolean;
}

function getMonthsBetweenDates(startDate: string, endDate: string): MonthData[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const months: MonthData[] = [];
  
  let year = start.getFullYear();
  let month = start.getMonth() + 1;
  
  while (year < end.getFullYear() || (year === end.getFullYear() && month <= end.getMonth() + 1)) {
    const isPast = year < currentYear || (year === currentYear && month < currentMonth);
    const isCurrent = year === currentYear && month === currentMonth;
    
    months.push({
      month,
      year,
      isPast,
      isCurrent,
    });
    
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return months;
}

export function MonthlyProgressGrid({ objective, onAddProgress, onUpdateProgress, onDeleteProgress }: MonthlyProgressGridProps) {
  const [editingMonth, setEditingMonth] = useState<{ month: number; year: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const config = valueTypeConfig[objective.valueType];
  const months = getMonthsBetweenDates(objective.createdAt, objective.deadline);
  
  // Attach existing logs to months
  const monthsWithLogs = months.map((m) => ({
    ...m,
    log: objective.progressLogs.find((log) => log.month === m.month && log.year === m.year),
  }));
  
  const formatValue = (value: number) => {
    return `${config.prefix}${value.toLocaleString('pt-BR')}${config.suffix}`;
  };
  
  const handleOpenEdit = (monthData: MonthData & { log?: ProgressLog }) => {
    setEditingMonth({ month: monthData.month, year: monthData.year });
    setEditValue(monthData.log?.value?.toString() || "");
    setEditDescription(monthData.log?.description || "");
  };
  
  const handleSave = () => {
    if (!editingMonth || !editValue) return;
    
    const existingLog = objective.progressLogs.find(
      (log) => log.month === editingMonth.month && log.year === editingMonth.year
    );
    
    if (existingLog) {
      onUpdateProgress(editingMonth.month, editingMonth.year, parseFloat(editValue), editDescription);
    } else {
      onAddProgress(editingMonth.month, editingMonth.year, parseFloat(editValue), editDescription);
    }
    
    setEditingMonth(null);
    setEditValue("");
    setEditDescription("");
  };
  
  const getMonthLabel = () => {
    if (objective.valueType === "quantity") {
      return "Conquistas deste mês";
    }
    return "Resultado do mês";
  };
  
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Progresso Mensal</h4>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {monthsWithLogs.map((monthData) => {
            const hasLog = !!monthData.log;
            
            return (
              <button
                key={`${monthData.year}-${monthData.month}`}
                onClick={() => handleOpenEdit(monthData)}
                className={cn(
                  "relative p-3 rounded-lg border text-left transition-all hover:border-primary/50 group",
                  hasLog 
                    ? "bg-success/10 border-success/30" 
                    : monthData.isCurrent 
                      ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20" 
                      : monthData.isPast 
                        ? "bg-muted/50 border-border" 
                        : "bg-card border-border"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn(
                      "text-xs font-medium",
                      monthData.isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {monthNames[monthData.month - 1]}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{monthData.year}</p>
                  </div>
                  {hasLog ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  ) : (
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full transition-colors",
                      "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                    )}>
                      <Plus className="h-3 w-3" />
                    </div>
                  )}
                </div>
                
                {hasLog && (
                  <p className="text-sm font-semibold text-foreground mt-1.5">
                    {formatValue(monthData.log!.value)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-success/30" />
            <span>Registrado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-primary/30 ring-1 ring-primary/50" />
            <span>Mês atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-muted/50 border border-border" />
            <span>Pendente</span>
          </div>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingMonth} onOpenChange={(open) => !open && setEditingMonth(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingMonth && objective.progressLogs.find(
                (log) => log.month === editingMonth.month && log.year === editingMonth.year
              ) ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Editar Registro
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Registrar Progresso
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingMonth && `${fullMonthNames[editingMonth.month - 1]} de ${editingMonth.year}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthValue">{getMonthLabel()}</Label>
              <div className="relative">
                {config.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {config.prefix}
                  </span>
                )}
                <Input
                  id="monthValue"
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={config.prefix ? "pl-10" : ""}
                  placeholder={objective.valueType === "quantity" ? "Ex: 2" : "Ex: 45000"}
                />
                {config.suffix && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {config.suffix}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthDescription">Descrição (opcional)</Label>
              <Textarea
                id="monthDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="O que foi conquistado neste mês?"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {editingMonth && objective.progressLogs.find(
              (log) => log.month === editingMonth.month && log.year === editingMonth.year
            ) && (
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive sm:mr-auto"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditingMonth(null)}>
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
              Tem certeza que deseja excluir o registro de{" "}
              {editingMonth && `${fullMonthNames[editingMonth.month - 1]} de ${editingMonth.year}`}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (editingMonth) {
                  onDeleteProgress(editingMonth.month, editingMonth.year);
                  setShowDeleteAlert(false);
                  setEditingMonth(null);
                  setEditValue("");
                  setEditDescription("");
                }
              }} 
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
