import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, ClientStatus } from "@/types";
import { clientSchema, ClientFormData } from "@/lib/validations";
import { CLIENT_SEGMENTS } from "@/lib/constants";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: Omit<Client, "id" | "created_at" | "updated_at" | "npsHistory">) => Promise<unknown> | void;
}

export function ClientForm({ open, onOpenChange, client, onSubmit }: ClientFormProps) {
  const isEditing = !!client;
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      name: client.name,
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      segment: client.segment || "",
      status: client.status,
      monthly_value: client.monthly_value || 0,
      contract_start: client.contract_start || "",
      notes: client.notes || "",
    } : {
      name: "",
      company: "",
      email: "",
      phone: "",
      segment: "",
      status: "ativo" as ClientStatus,
      monthly_value: 0,
      contract_start: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const handleFormSubmit = async (data: ClientFormData) => {
    const result = await onSubmit({
      space_id: client?.space_id || "",
      name: data.name,
      company: data.company || null,
      email: data.email || null,
      phone: data.phone || null,
      segment: data.segment || null,
      status: data.status,
      monthly_value: data.monthly_value || null,
      contract_start: data.contract_start || null,
      package: client?.package || null,
      notes: data.notes || null,
      created_by: client?.created_by || null,
    });
    
    if (result !== null && result !== undefined) {
      reset();
      onOpenChange(false);
    }
  };

  const currentSegment = watch("segment");
  const currentStatus = watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Contato *</Label>
              <Input id="name" {...register("name")} placeholder="Nome do contato" maxLength={100} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" {...register("company")} placeholder="Nome da empresa" maxLength={100} />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@empresa.com" maxLength={255} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" maxLength={20} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Select value={currentSegment} onValueChange={(v) => setValue("segment", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_SEGMENTS.map((seg) => (
                    <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.segment && <p className="text-xs text-destructive">{errors.segment.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={currentStatus} onValueChange={(v) => setValue("status", v as ClientStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="churn">Churn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_value">Valor Mensal (R$)</Label>
              <Input 
                id="monthly_value" 
                type="number" 
                {...register("monthly_value", { valueAsNumber: true })} 
                placeholder="0"
                min={0}
              />
              {errors.monthly_value && <p className="text-xs text-destructive">{errors.monthly_value.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contract_start">Data de Início</Label>
              <Input id="contract_start" type="date" {...register("contract_start")} />
              {errors.contract_start && <p className="text-xs text-destructive">{errors.contract_start.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              {...register("notes")} 
              placeholder="Observações sobre o cliente..." 
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground">
              {isEditing ? "Salvar Alterações" : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
