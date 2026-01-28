import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Client, NPSRecord } from "@/types";
import { Building2, Mail, Phone, Calendar, Package, TrendingUp, Star, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateClientNPS, getLatestNPS } from "@/hooks/useClients";
import { CLIENT_STATUSES, MONTHS, getNPSColor } from "@/lib/constants";
import { usePermissions } from "@/hooks/usePermissions";

interface ClientDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteNPSRecord: (recordId: string) => void;
}

function NPSScoreBadge({ score }: { score: number }) {
  const colorClass = getNPSColor(score);
  const bgClass = score >= 9 ? "bg-success/10" : score >= 7 ? "bg-warning/10" : "bg-destructive/10";

  return (
    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md", bgClass)}>
      <Star className={cn("h-3.5 w-3.5 fill-current", colorClass)} />
      <span className={cn("text-sm font-semibold", colorClass)}>{score}</span>
    </div>
  );
}

function calculateLTV(monthlyValue: number, startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const months = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return monthlyValue * months;
}

export function ClientDetail({ open, onOpenChange, client, onEdit, onDelete, onDeleteNPSRecord }: ClientDetailProps) {
  const { canDelete } = usePermissions();

  if (!client) return null;

  const avgNPS = calculateClientNPS(client.npsHistory);
  const latestNPS = getLatestNPS(client.npsHistory);
  const ltv = calculateLTV(client.monthlyValue, client.startDate);
  const statusConfig = CLIENT_STATUSES[client.status];

  // Sort NPS history by date (newest first)
  const sortedNPSHistory = [...client.npsHistory].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl">{client.company}</DialogTitle>
                <p className="text-sm text-muted-foreground">{client.segment}</p>
              </div>
            </div>
            <Badge className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Contato</p>
                <p className="text-sm font-medium">{client.contact}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{client.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{client.phone}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cliente desde</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{new Date(client.startDate).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Pacote</p>
                </div>
                <p className="text-lg font-semibold">{client.package}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-muted-foreground mb-1">Valor Mensal</p>
                <p className="text-lg font-semibold text-success">R$ {client.monthlyValue.toLocaleString('pt-BR')}</p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">LTV</p>
                </div>
                <p className="text-lg font-semibold">R$ {ltv.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <Separator />

            {/* NPS Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Histórico de NPS</h3>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Média</p>
                    <p className="text-lg font-semibold">{avgNPS || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Último</p>
                    {latestNPS !== null ? (
                      <NPSScoreBadge score={latestNPS} />
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </div>
                </div>
              </div>

              {sortedNPSHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum registro de NPS ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedNPSHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <NPSScoreBadge score={record.score} />
                        <div>
                          <p className="text-sm font-medium">
                            {MONTHS[record.month - 1]} {record.year}
                          </p>
                          {record.notes && (
                            <p className="text-xs text-muted-foreground">{record.notes}</p>
                          )}
                        </div>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => onDeleteNPSRecord(record.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {client.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Observações</h3>
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex justify-between">
          {canDelete ? (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Excluir Cliente
            </Button>
          ) : (
            <div /> // Placeholder para manter layout
          )}
          <Button onClick={onEdit} className="gap-1.5">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
