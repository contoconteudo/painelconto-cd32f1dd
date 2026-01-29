import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Objective } from "@/types";
import { OBJECTIVE_UNITS, OBJECTIVE_CATEGORIES } from "@/lib/constants";

interface ObjectiveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Objective, "id" | "created_at" | "updated_at" | "progressLogs" | "current_value" | "status">) => void;
  objective?: Objective;
  mode: "create" | "edit";
}

export function ObjectiveForm({ open, onOpenChange, onSubmit, objective, mode }: ObjectiveFormProps) {
  const [title, setTitle] = useState(objective?.title || "");
  const [description, setDescription] = useState(objective?.description || "");
  const [category, setCategory] = useState(objective?.category || "");
  const [unit, setUnit] = useState(objective?.unit || "%");
  const [targetValue, setTargetValue] = useState(objective?.target_value?.toString() || "");
  const [startDate, setStartDate] = useState(objective?.start_date || "");
  const [endDate, setEndDate] = useState(objective?.end_date || "");

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
    }
  }, [open, objective]);

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
      is_commercial: objective?.is_commercial || false,
      value_type: objective?.value_type || null,
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
    onOpenChange(false);
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
