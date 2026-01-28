import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Objective, ObjectiveValueType, CommercialDataSource } from "@/types";
import { TrendingUp, Users, Database } from "lucide-react";

interface ObjectiveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Objective, "id" | "createdAt" | "progressLogs" | "currentValue" | "status" | "project_id" | "user_id">) => void;
  objective?: Objective;
  mode: "create" | "edit";
}

const valueTypeLabels: Record<ObjectiveValueType, string> = {
  financial: "Financeiro (R$)",
  quantity: "Quantidade",
  percentage: "Porcentagem (%)",
};

const dataSourceLabels: Record<CommercialDataSource, { label: string; description: string; icon: typeof TrendingUp }> = {
  crm: { 
    label: "CRM (Novas Vendas)", 
    description: "Leads convertidos em negócios fechados",
    icon: TrendingUp 
  },
  clients: { 
    label: "Clientes Ativos", 
    description: "MRR de clientes com status ativo",
    icon: Users 
  },
};

export function ObjectiveForm({ open, onOpenChange, onSubmit, objective, mode }: ObjectiveFormProps) {
  const [name, setName] = useState(objective?.name || "");
  const [description, setDescription] = useState(objective?.description || "");
  const [valueType, setValueType] = useState<ObjectiveValueType>(objective?.valueType || "financial");
  const [targetValue, setTargetValue] = useState(objective?.targetValue?.toString() || "");
  const [deadline, setDeadline] = useState(objective?.deadline || "");
  const [isCommercial, setIsCommercial] = useState(objective?.isCommercial || false);
  const [dataSources, setDataSources] = useState<CommercialDataSource[]>(objective?.dataSources || []);

  // Reset form when dialog opens/closes or objective changes
  useEffect(() => {
    if (open) {
      setName(objective?.name || "");
      setDescription(objective?.description || "");
      setValueType(objective?.valueType || "financial");
      setTargetValue(objective?.targetValue?.toString() || "");
      setDeadline(objective?.deadline || "");
      setIsCommercial(objective?.isCommercial || false);
      setDataSources(objective?.dataSources || []);
    }
  }, [open, objective]);

  const handleDataSourceToggle = (source: CommercialDataSource) => {
    setDataSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !targetValue || !deadline) return;
    if (isCommercial && dataSources.length === 0) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      valueType,
      targetValue: parseFloat(targetValue),
      deadline,
      isCommercial,
      dataSources: isCommercial ? dataSources : [],
    });

    // Reset form
    setName("");
    setDescription("");
    setValueType("financial");
    setTargetValue("");
    setDeadline("");
    setIsCommercial(false);
    setDataSources([]);
    onOpenChange(false);
  };

  const getPlaceholder = () => {
    switch (valueType) {
      case "financial": return "Ex: 50000";
      case "quantity": return "Ex: 5";
      case "percentage": return "Ex: 75";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo Objetivo Estratégico" : "Editar Objetivo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Objetivo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              <Label htmlFor="valueType">Tipo de Meta</Label>
              <Select value={valueType} onValueChange={(v: ObjectiveValueType) => setValueType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(valueTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetValue">Valor da Meta</Label>
              <Input
                id="targetValue"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={getPlaceholder()}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          {/* Seção de Meta Comercial */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <Label htmlFor="isCommercial" className="text-sm font-medium cursor-pointer">
                  Meta Comercial Automática
                </Label>
              </div>
              <Switch
                id="isCommercial"
                checked={isCommercial}
                onCheckedChange={(checked) => {
                  setIsCommercial(checked);
                  if (!checked) setDataSources([]);
                }}
              />
            </div>
            
            {isCommercial && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Selecione as fontes de dados para cálculo automático:
                </p>
                
                {(Object.entries(dataSourceLabels) as [CommercialDataSource, typeof dataSourceLabels.crm][]).map(
                  ([key, { label, description, icon: Icon }]) => (
                    <div
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        dataSources.includes(key)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDataSourceToggle(key);
                      }}
                    >
                      <Checkbox
                        id={`source-${key}`}
                        checked={dataSources.includes(key)}
                        onCheckedChange={() => handleDataSourceToggle(key)}
                        className="mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  )
                )}

                {dataSources.length === 0 && (
                  <p className="text-xs text-destructive">
                    Selecione pelo menos uma fonte de dados
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
              disabled={isCommercial && dataSources.length === 0}
            >
              {mode === "create" ? "Criar Objetivo" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}