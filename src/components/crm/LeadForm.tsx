import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead, LeadTemperature, LeadStage } from "@/types";
import { leadSchema, LeadFormData } from "@/lib/validations";
import { LEAD_STAGES, LEAD_TEMPERATURES, LEAD_ORIGINS } from "@/lib/constants";

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Lead, "id" | "createdAt" | "stageChangedAt" | "project_id" | "user_id">) => void;
  lead?: Lead;
  mode: "create" | "edit";
  defaultStage?: LeadStage;
}

export function LeadForm({ open, onOpenChange, onSubmit, lead, mode, defaultStage = "new" }: LeadFormProps) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch,
    reset 
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead ? {
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      value: lead.value,
      temperature: lead.temperature,
      origin: lead.origin,
      stage: lead.stage,
      notes: lead.notes,
    } : {
      name: "",
      company: "",
      email: "",
      phone: "",
      value: 0,
      temperature: "warm",
      origin: "",
      stage: defaultStage,
      notes: "",
    },
  });

  const currentTemperature = watch("temperature");
  const currentOrigin = watch("origin");
  const currentStage = watch("stage");

  const handleFormSubmit = (data: LeadFormData) => {
    onSubmit({
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      value: data.value,
      temperature: data.temperature,
      origin: data.origin,
      stage: data.stage,
      lastContact: new Date().toISOString().split("T")[0],
      notes: data.notes,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo Lead" : "Editar Lead"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Contato *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="João Silva"
                maxLength={100}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="Tech Corp"
                maxLength={100}
              />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="joao@empresa.com"
                maxLength={255}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(11) 99999-9999"
                maxLength={20}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor Estimado</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="value"
                  type="number"
                  {...register("value", { valueAsNumber: true })}
                  className="pl-10"
                  placeholder="5000"
                  min={0}
                />
              </div>
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Temperatura</Label>
              <Select 
                value={currentTemperature} 
                onValueChange={(v: LeadTemperature) => setValue("temperature", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LEAD_TEMPERATURES) as [LeadTemperature, { label: string; emoji: string }][]).map(
                    ([key, { label, emoji }]) => (
                      <SelectItem key={key} value={key}>{emoji} {label}</SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={currentOrigin} onValueChange={(v) => setValue("origin", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_ORIGINS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estágio</Label>
              <Select 
                value={currentStage} 
                onValueChange={(v: LeadStage) => setValue("stage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LEAD_STAGES) as [LeadStage, { name: string }][]).map(
                    ([key, { name }]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Informações adicionais sobre o lead..."
              rows={2}
              maxLength={1000}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              {mode === "create" ? "Adicionar Lead" : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}