import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, NPSRecord } from "@/types";
import { Building2, Mail, Phone, Calendar, TrendingUp, Star, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateClientNPS, getLatestNPS } from "@/hooks/useClients";
import { CLIENT_STATUSES, getNPSColor, MONTHS } from "@/lib/constants";
import { usePermissions } from "@/hooks/usePermissions";

interface ClientDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddNPSRecord: (record: { score: number; feedback?: string; month: number; year: number }) => Promise<void> | void;
  onDeleteNPSRecord: (recordId: string) => void;
}

function NPSInputButtons({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className={cn(
            "h-7 w-7 rounded text-xs font-medium transition-colors",
            value === score
              ? score >= 9
                ? "bg-success text-success-foreground"
                : score >= 7
                  ? "bg-warning text-warning-foreground"
                  : "bg-destructive text-destructive-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {score}
        </button>
      ))}
    </div>
  );
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

function calculateLTV(monthlyValue: number | null, contractStart: string | null): number {
  if (!monthlyValue || !contractStart) return 0;
  const start = new Date(contractStart);
  const now = new Date();
  const months = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return monthlyValue * months;
}

// Helper para gerar anos disponíveis
function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1];
}

export function ClientDetail({ open, onOpenChange, client, onEdit, onDelete, onAddNPSRecord, onDeleteNPSRecord }: ClientDetailProps) {
  const { canDelete } = usePermissions();
  const [newScore, setNewScore] = useState<number | null>(null);
  const [newFeedback, setNewFeedback] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isSavingNps, setIsSavingNps] = useState(false);

  if (!client) return null;

  const avgNPS = calculateClientNPS(client.npsHistory || []);
  const latestNPS = getLatestNPS(client.npsHistory || []);
  const ltv = calculateLTV(client.monthly_value, client.contract_start);
  const statusConfig = CLIENT_STATUSES[client.status];

  // Sort NPS history by date (newest first)
  const sortedNPSHistory = [...(client.npsHistory || [])].sort((a, b) => 
    new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

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
                <DialogTitle className="text-xl">{client.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{client.company || client.segment || "Sem empresa"}</p>
              </div>
            </div>
            <Badge className={statusConfig?.className}>
              {statusConfig?.label || client.status}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Segmento</p>
                <p className="text-sm font-medium">{client.segment || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{client.email || "-"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{client.phone || "-"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cliente desde</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">
                    {client.contract_start 
                      ? new Date(client.contract_start).toLocaleDateString("pt-BR") 
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card">
                <p className="text-xs text-muted-foreground mb-1">Valor Mensal</p>
                <p className="text-lg font-semibold text-success">
                  R$ {(client.monthly_value || 0).toLocaleString('pt-BR')}
                </p>
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

              {/* Quick add */}
              <div className="rounded-lg border bg-muted/20 p-3 mb-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Registrar novo NPS</p>
                    <NPSInputButtons value={newScore} onChange={setNewScore} />
                  </div>
                  
                  {/* Seleção de mês/ano */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select 
                        value={selectedMonth.toString()} 
                        onValueChange={(v) => setSelectedMonth(parseInt(v))}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Select 
                        value={selectedYear.toString()} 
                        onValueChange={(v) => setSelectedYear(parseInt(v))}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Feedback (opcional)"
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      className="text-sm"
                      maxLength={1000}
                    />
                    <Button
                      className="gradient-primary text-primary-foreground sm:w-28"
                      disabled={newScore === null || isSavingNps}
                      onClick={async () => {
                        if (newScore === null) return;
                        setIsSavingNps(true);
                        try {
                          await onAddNPSRecord({
                            score: newScore,
                            feedback: newFeedback.trim() ? newFeedback.trim() : undefined,
                            month: selectedMonth,
                            year: selectedYear,
                          });
                          setNewScore(null);
                          setNewFeedback("");
                          // Avançar para o próximo mês
                          if (selectedMonth === 11) {
                            setSelectedMonth(0);
                            setSelectedYear(selectedYear + 1);
                          } else {
                            setSelectedMonth(selectedMonth + 1);
                          }
                        } finally {
                          setIsSavingNps(false);
                        }
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>

              {sortedNPSHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum registro de NPS ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedNPSHistory.map((record) => {
                    const recordDate = new Date(record.recorded_at);
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group"
                      >
                        <div className="flex items-center gap-3">
                          {record.score !== null && <NPSScoreBadge score={record.score} />}
                          <div>
                            <p className="text-sm font-medium">
                              {MONTHS[recordDate.getMonth()]} {recordDate.getFullYear()}
                            </p>
                            {record.feedback && (
                              <p className="text-xs text-muted-foreground">{record.feedback}</p>
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
                    );
                  })}
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
            <div />
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
