import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Objective } from "@/types";
import { OBJECTIVE_UNITS, OBJECTIVE_CATEGORIES } from "@/lib/constants";
import { Zap, Users, TrendingUp } from "lucide-react";

// Tipos de fonte de dados para metas automáticas
type AutoDataSource = "none" | "crm_pipeline" | "crm_won" | "clients_mrr" | "clients_count";

interface ObjectiveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status">) => void;
  objective?: Objective;
  mode: "create" | "edit";
}

const AUTO_DATA_SOURCES: { value: AutoDataSource; label: string; description: string; icon: React.ElementType }[] = [
  { value: "none", label: "Manual", description: "Registrar progresso manualmente", icon: TrendingUp },
  { value: "crm_pipeline", label: "Pipeline CRM", description: "Soma do valor dos leads em negociação", icon: Zap },
  { value: "crm_won", label: "Leads Ganhos", description: "Soma do valor dos leads ganhos", icon: Zap },
  { value: "clients_mrr", label: "MRR Clientes", description: "Receita mensal total de clientes ativos", icon: Users },
  { value: "clients_count", label: "Qtd. Clientes", description: "Quantidade de clientes ativos", icon: Users },
];

export function ObjectiveForm({ open, onOpenChange, onSubmit, objective, mode }: ObjectiveFormProps) {
  const [title, setTitle] = useState(objective?.title || "");
  const [description, setDescription] = useState(objective?.description || "");
  const [category, setCategory] = useState(objective?.category || "");
  const [unit, setUnit] = useState(objective?.unit || "%");
  const [targetValue, setTargetValue] = useState(objective?.target_value?.toString() || "");
  const [startDate, setStartDate] = useState(objective?.start_date || "");
  const [endDate, setEndDate] = useState(objective?.end_date || "");
  const [isCommercial, setIsCommercial] = useState(objective?.is_commercial || false);
  const [autoDataSource, setAutoDataSource] = useState<AutoDataSource>(
    (objective?.value_type as AutoDataSource) || "none"
  );

  // Reset form when dialog opens/closes or objective changes
  useEffect(() => {
    if (open) {
      setTitle(objective?.title || "");
      setDescription(objective?.description || "");
      setCategory(objective?.category || "");
      setUnit(objective?.unit || "%");
      setTargetValue(objective?.target_value?.toString() || "");
      setStartDate(objective?.start_date || "");
      setEndDate(objective?.end_date || "");
      setIsCommercial(objective?.is_commercial || false);
      setAutoDataSource((objective?.value_type as AutoDataSource) || "none");
    }
  }, [open, objective]);

  // Ajustar unidade automaticamente baseado na fonte de dados
  useEffect(() => {
    if (isCommercial && autoDataSource !== "none") {
      if (autoDataSource === "clients_count") {
        setUnit("un");
      } else {
        setUnit("R$");
      }
    }
  }, [autoDataSource, isCommercial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    onSubmit({
      space_id: objective?.space_id || "",
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      target_value: targetValue ? parseFloat(targetValue) : null,
      unit: unit,
      start_date: startDate || null,
      end_date: endDate || null,
      is_commercial: isCommercial,
      value_type: isCommercial ? autoDataSource : null,
      created_by: objective?.created_by || null,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setCategory("");
    setUnit("%");
    setTargetValue("");
    setStartDate("");
    setEndDate("");
    setIsCommercial(false);
    setAutoDataSource("none");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo Objetivo Estratégico" : "Editar Objetivo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Objetivo *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aumentar faturamento em 67%"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo e como pretende alcançá-lo"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVE_UNITS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Valor da Meta</Label>
            <Input
              id="targetValue"
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Ex: 100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Prazo Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Meta Comercial Toggle */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="commercial-toggle" className="text-sm font-semibold">
                  Meta Comercial
                </Label>
                <p className="text-xs text-muted-foreground">
                  Vincular progresso aos dados de CRM ou Clientes
                </p>
              </div>
              <Switch
                id="commercial-toggle"
                checked={isCommercial}
                onCheckedChange={setIsCommercial}
              />
            </div>

            {isCommercial && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <Label className="text-xs text-muted-foreground">Fonte de dados automática</Label>
                <div className="grid grid-cols-1 gap-2">
                  {AUTO_DATA_SOURCES.map((source) => {
                    const Icon = source.icon;
                    const isSelected = autoDataSource === source.value;
                    
                    return (
                      <button
                        key={source.value}
                        type="button"
                        onClick={() => setAutoDataSource(source.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                            : "bg-card hover:bg-accent/5 border-border/50"
                        }`}
                      >
                        <div className={`p-2 rounded-md ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                          <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {source.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {source.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {autoDataSource !== "none" && (
                  <p className="text-xs text-primary/80 bg-primary/5 p-2 rounded">
                    ⚡ O progresso será atualizado automaticamente com base nos dados selecionados.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary text-primary-foreground"
            >
              {mode === "create" ? "Criar Objetivo" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}