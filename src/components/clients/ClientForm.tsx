import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, ClientStatus } from "@/types";

const clientSchema = z.object({
  company: z.string().min(1, "Nome da empresa é obrigatório").max(100),
  contact: z.string().min(1, "Nome do contato é obrigatório").max(100),
  email: z.string().email("Email inválido").max(255),
  phone: z.string().min(1, "Telefone é obrigatório").max(20),
  segment: z.string().min(1, "Segmento é obrigatório").max(50),
  package: z.string().min(1, "Pacote é obrigatório"),
  monthlyValue: z.number().min(0, "Valor deve ser positivo"),
  status: z.enum(["active", "inactive", "churn"] as const),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  notes: z.string().max(1000).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: Omit<Client, "id" | "npsHistory">) => void;
}

const packages = ["PF/Básico", "Start", "Completão", "Enterprise"];
const segments = ["Tecnologia", "Saúde", "Varejo", "Serviços", "Educação", "Indústria", "Financeiro", "Outro"];

export function ClientForm({ open, onOpenChange, client, onSubmit }: ClientFormProps) {
  const isEditing = !!client;
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      company: client.company,
      contact: client.contact,
      email: client.email,
      phone: client.phone,
      segment: client.segment,
      package: client.package,
      monthlyValue: client.monthlyValue,
      status: client.status,
      startDate: client.startDate,
      notes: client.notes || "",
    } : {
      company: "",
      contact: "",
      email: "",
      phone: "",
      segment: "",
      package: "",
      monthlyValue: 0,
      status: "active" as ClientStatus,
      startDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit({
      company: data.company,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
      segment: data.segment,
      package: data.package,
      monthlyValue: data.monthlyValue,
      status: data.status,
      startDate: data.startDate,
      notes: data.notes || "",
    });
    reset();
    onOpenChange(false);
  };

  const currentPackage = watch("package");
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
              <Label htmlFor="company">Empresa *</Label>
              <Input id="company" {...register("company")} placeholder="Nome da empresa" />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact">Contato *</Label>
              <Input id="contact" {...register("contact")} placeholder="Nome do contato" />
              {errors.contact && <p className="text-xs text-destructive">{errors.contact.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@empresa.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segmento *</Label>
              <Select value={currentSegment} onValueChange={(v) => setValue("segment", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((seg) => (
                    <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.segment && <p className="text-xs text-destructive">{errors.segment.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Pacote *</Label>
              <Select value={currentPackage} onValueChange={(v) => setValue("package", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pacote" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.package && <p className="text-xs text-destructive">{errors.package.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyValue">Valor Mensal (R$) *</Label>
              <Input 
                id="monthlyValue" 
                type="number" 
                {...register("monthlyValue", { valueAsNumber: true })} 
                placeholder="0" 
              />
              {errors.monthlyValue && <p className="text-xs text-destructive">{errors.monthlyValue.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={currentStatus} onValueChange={(v) => setValue("status", v as ClientStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="churn">Churn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início *</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
            {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              {...register("notes")} 
              placeholder="Observações sobre o cliente..." 
              rows={3}
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
