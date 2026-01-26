import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Objective, ObjectiveValueType } from "@/types";

interface ProgressLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: number, description: string) => void;
  objective: Objective;
}

const valueTypeLabels: Record<ObjectiveValueType, { label: string; prefix: string; suffix: string }> = {
  financial: { label: "Valor Atual", prefix: "R$ ", suffix: "" },
  quantity: { label: "Quantidade Atual", prefix: "", suffix: "" },
  percentage: { label: "Porcentagem Atual", prefix: "", suffix: "%" },
};

export function ProgressLogForm({ open, onOpenChange, onSubmit, objective }: ProgressLogFormProps) {
  const [value, setValue] = useState(objective.currentValue.toString());
  const [description, setDescription] = useState("");

  const config = valueTypeLabels[objective.valueType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value || !description.trim()) return;

    onSubmit(parseFloat(value), description.trim());
    setValue(objective.currentValue.toString());
    setDescription("");
    onOpenChange(false);
  };

  const progress = Math.round((parseFloat(value) / objective.targetValue) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Registrar Progresso</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {objective.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Progress Preview */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso atual</span>
              <span className="text-sm font-semibold">
                {config.prefix}{objective.currentValue.toLocaleString('pt-BR')}{config.suffix} / {config.prefix}{objective.targetValue.toLocaleString('pt-BR')}{config.suffix}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-300" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">{Math.min(progress, 100)}% concluído</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">{config.label}</Label>
            <div className="relative">
              {config.prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {config.prefix}
                </span>
              )}
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={config.prefix ? "pl-10" : ""}
                required
              />
              {config.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {config.suffix}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">O que foi feito?</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que foi realizado para alcançar esse progresso..."
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              Registrar Progresso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
