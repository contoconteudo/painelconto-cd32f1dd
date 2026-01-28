import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Client, NPSRecord } from "@/types";
import { Star, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLatestNPS } from "@/hooks/useClients";
import { MONTHS, getNPSColor } from "@/lib/constants";

interface NPSQuickRegisterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onAddNPS: (clientId: string, record: Omit<NPSRecord, "id" | "client_id">) => void;
}

function NPSInput({ 
  value, 
  onChange 
}: { 
  value: number | null; 
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className={cn(
            "w-7 h-7 text-xs font-medium rounded transition-all",
            value === score
              ? score >= 9
                ? "bg-success text-success-foreground"
                : score >= 7
                ? "bg-warning text-warning-foreground"
                : "bg-destructive text-destructive-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          {score}
        </button>
      ))}
    </div>
  );
}

export function NPSQuickRegister({ open, onOpenChange, clients, onAddNPS }: NPSQuickRegisterProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [npsValues, setNpsValues] = useState<Record<string, number | null>>({});
  const [npsNotes, setNpsNotes] = useState<Record<string, string>>({});
  const [savedClients, setSavedClients] = useState<Set<string>>(new Set());

  // Only show active clients
  const activeClients = clients.filter((c) => c.status === "active");

  const handleSaveNPS = (clientId: string) => {
    const score = npsValues[clientId];
    if (score === null || score === undefined) return;

    onAddNPS(clientId, {
      month: selectedMonth,
      year: selectedYear,
      score,
      notes: npsNotes[clientId] || "",
      recordedAt: new Date().toISOString().split("T")[0],
    });

    setSavedClients((prev) => new Set(prev).add(clientId));
  };

  const handleSaveAll = () => {
    activeClients.forEach((client) => {
      if (npsValues[client.id] !== null && npsValues[client.id] !== undefined) {
        handleSaveNPS(client.id);
      }
    });
    onOpenChange(false);
  };

  const years = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Registro Rápido de NPS
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <div className="space-y-1">
            <Label>Mês</Label>
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Ano</Label>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3">
            {activeClients.map((client) => {
              const latestNPS = getLatestNPS(client.npsHistory);
              const isSaved = savedClients.has(client.id);

              return (
                <div
                  key={client.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    isSaved ? "bg-success/5 border-success/20" : "bg-muted/30 border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{client.company}</p>
                        <p className="text-xs text-muted-foreground">
                          Último NPS: {latestNPS !== null ? latestNPS : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <NPSInput
                        value={npsValues[client.id] ?? null}
                        onChange={(v) => setNpsValues((prev) => ({ ...prev, [client.id]: v }))}
                      />
                      <Button
                        size="sm"
                        variant={isSaved ? "default" : "outline"}
                        className={cn("w-20", isSaved && "bg-success hover:bg-success/90")}
                        onClick={() => handleSaveNPS(client.id)}
                        disabled={npsValues[client.id] === null || npsValues[client.id] === undefined}
                      >
                        {isSaved ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Salvo
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 ml-12">
                    <Input
                      placeholder="Observação (opcional)"
                      value={npsNotes[client.id] || ""}
                      onChange={(e) => setNpsNotes((prev) => ({ ...prev, [client.id]: e.target.value }))}
                      className="text-sm h-8"
                      maxLength={1000}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {Object.values(npsValues).filter((v) => v !== null && v !== undefined).length} de {activeClients.length} preenchidos
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleSaveAll} className="gradient-primary text-primary-foreground">
              Salvar Todos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}