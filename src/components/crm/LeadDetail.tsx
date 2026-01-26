import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead, LeadStage } from "@/types";
import { LeadForm } from "./LeadForm";
import { Pencil, Trash2, Phone, Mail, Building2, Clock, DollarSign, Flame, Thermometer, Snowflake, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface LeadDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onUpdate: (id: string, data: Partial<Lead>) => void;
  onDelete: (id: string) => void;
  onMoveToStage: (id: string, stage: LeadStage) => void;
}

const stageConfig: Record<LeadStage, { label: string; color: string }> = {
  new: { label: "Novo", color: "bg-muted-foreground" },
  contact: { label: "Contato Realizado", color: "bg-primary" },
  proposal: { label: "Proposta Enviada", color: "bg-warning" },
  negotiation: { label: "Em Negociação", color: "bg-success" },
  won: { label: "Ganho", color: "bg-success" },
  lost: { label: "Perdido", color: "bg-destructive" },
};

const temperatureConfig = {
  hot: { icon: Flame, label: "Quente", class: "text-destructive" },
  warm: { icon: Thermometer, label: "Morno", class: "text-warning" },
  cold: { icon: Snowflake, label: "Frio", class: "text-primary" },
};

export function LeadDetail({ open, onOpenChange, lead, onUpdate, onDelete, onMoveToStage }: LeadDetailProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!lead) return null;

  const stage = stageConfig[lead.stage];
  const temp = temperatureConfig[lead.temperature];
  const TempIcon = temp.icon;

  const handleDelete = () => {
    onDelete(lead.id);
    setShowDeleteAlert(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold leading-tight mb-1">
                  {lead.name}
                </SheetTitle>
                <SheetDescription>{lead.company}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Status & Temperature */}
            <div className="flex items-center gap-3">
              <Badge className="gap-1">
                <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                {stage.label}
              </Badge>
              <div className={cn("flex items-center gap-1 text-sm", temp.class)}>
                <TempIcon className="h-4 w-4" />
                {temp.label}
              </div>
            </div>

            {/* Value */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Valor Estimado</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                R$ {lead.value.toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Contato</h4>
              
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-sm text-primary hover:underline">
                    {lead.email}
                  </a>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-sm text-primary hover:underline">
                    {lead.phone}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Último contato: {new Date(lead.lastContact).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Origin */}
            {lead.origin && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Origem</h4>
                <Badge variant="secondary">{lead.origin}</Badge>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Observações</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Move to Stage */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Mover para</h4>
              <Select 
                value={lead.stage} 
                onValueChange={(stage: LeadStage) => onMoveToStage(lead.id, stage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stageConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1.5" onClick={() => setShowEditForm(true)}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive gap-1.5"
                onClick={() => setShowDeleteAlert(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Form */}
      <LeadForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        mode="edit"
        lead={lead}
        onSubmit={(data) => {
          onUpdate(lead.id, data);
          setShowEditForm(false);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead "{lead.name}" de {lead.company}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
