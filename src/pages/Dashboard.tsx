import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { PipelineCard } from "@/components/dashboard/PipelineCard";
import { ObjectivesCard } from "@/components/dashboard/ObjectivesCard";
import { useLeads } from "@/hooks/useLeads";
import { useClients } from "@/hooks/useClients";
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Target,
  Handshake,
} from "lucide-react";

export default function Dashboard() {
  const { getPipelineStats } = useLeads();
  const { getStats: getClientStats } = useClients();

  const leadStats = getPipelineStats();
  const clientStats = getClientStats();

  // Bimonthly goal calculation (example: current month revenue goal)
  const bimonthlyTarget = 35000;
  const bimonthlyProgress = leadStats.wonValue + (clientStats.totalMRR * 0.5); // Simplified calculation

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral das metas e operação comercial">
      {/* KPI Cards - Focados em Metas e CRM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Leads em Negociação"
          value={leadStats.inNegotiation.toString()}
          trend={{ 
            value: `${leadStats.totalLeads} no pipeline total`, 
            isPositive: true 
          }}
          icon={<Users className="h-5 w-5" />}
          iconClassName="gradient-primary text-primary-foreground"
        />
        <StatCard
          title="Valor em Pipeline"
          value={`R$ ${leadStats.totalValue.toLocaleString('pt-BR')}`}
          trend={{ 
            value: `${leadStats.wonCount} fechado(s)`, 
            isPositive: true 
          }}
          icon={<DollarSign className="h-5 w-5" />}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Propostas Enviadas"
          value={leadStats.proposalsSent.toString()}
          trend={{ 
            value: "Aguardando resposta", 
            isPositive: true 
          }}
          icon={<FileText className="h-5 w-5" />}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Taxa Conversão"
          value={`${leadStats.conversionRate}%`}
          trend={{ 
            value: leadStats.conversionRate >= 20 ? "Acima da média" : "Abaixo da média", 
            isPositive: leadStats.conversionRate >= 20 
          }}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      {/* Meta Bimestral + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ProgressCard
          title="Meta Bimestral"
          current={Math.round(bimonthlyProgress)}
          target={bimonthlyTarget}
          unit="R$ "
          className="lg:col-span-1"
        />
        <div className="lg:col-span-2">
          <PipelineCard />
        </div>
      </div>

      {/* Objetivos Estratégicos + Metas Comerciais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ObjectivesCard />
        
        {/* Metas Comerciais do Bimestre */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Metas Comerciais</h3>
            <span className="text-xs font-medium text-muted-foreground">Jan-Fev 2026</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Handshake className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Novos Clientes</p>
                <p className="text-xs text-muted-foreground">
                  Meta: 3 clientes | Atual: {leadStats.wonCount}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {Math.round((leadStats.wonCount / 3) * 100)}%
                </p>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1">
                  <div 
                    className="h-full rounded-full bg-success" 
                    style={{ width: `${Math.min((leadStats.wonCount / 3) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Faturamento Vendas</p>
                <p className="text-xs text-muted-foreground">
                  Meta: R$ 15k | Atual: R$ {(leadStats.wonValue / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {Math.round((leadStats.wonValue / 15000) * 100)}%
                </p>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1">
                  <div 
                    className="h-full rounded-full bg-primary" 
                    style={{ width: `${Math.min((leadStats.wonValue / 15000) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Target className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Taxa de Conversão</p>
                <p className="text-xs text-muted-foreground">
                  Meta: 30% | Atual: {leadStats.conversionRate}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {Math.round((leadStats.conversionRate / 30) * 100)}%
                </p>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1">
                  <div 
                    className="h-full rounded-full bg-warning" 
                    style={{ width: `${Math.min((leadStats.conversionRate / 30) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
