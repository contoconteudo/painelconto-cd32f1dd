import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Objective, ObjectiveValueType } from "@/types";

interface ObjectiveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Objective, "id" | "createdAt" | "progressLogs" | "currentValue" | "status">) => void;
  objective?: Objective;
  mode: "create" | "edit";
}

const valueTypeLabels: Record<ObjectiveValueType, string> = {
  financial: "Financeiro (R$)",
  quantity: "Quantidade",
  percentage: "Porcentagem (%)",
};

export function ObjectiveForm({ open, onOpenChange, onSubmit, objective, mode }: ObjectiveFormProps) {
  const [name, setName] = useState(objective?.name || "");
  const [description, setDescription] = useState(objective?.description || "");
  const [valueType, setValueType] = useState<ObjectiveValueType>(objective?.valueType || "financial");
  const [targetValue, setTargetValue] = useState(objective?.targetValue?.toString() || "");
  const [deadline, setDeadline] = useState(objective?.deadline || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !targetValue || !deadline) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      valueType,
      targetValue: parseFloat(targetValue),
      deadline,
    });

    // Reset form
    setName("");
    setDescription("");
    setValueType("financial");
    setTargetValue("");
    setDeadline("");
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              {mode === "create" ? "Criar Objetivo" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
