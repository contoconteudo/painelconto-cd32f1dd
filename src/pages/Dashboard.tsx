import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { PipelineCard } from "@/components/dashboard/PipelineCard";
import { ObjectivesCard } from "@/components/dashboard/ObjectivesCard";
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Target,
  Handshake,
} from "lucide-react";

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Visão geral das metas e operação comercial">
      {/* KPI Cards - Focados em Metas e CRM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Leads em Negociação"
          value="8"
          trend={{ value: "+3 esta semana", isPositive: true }}
          icon={<Users className="h-5 w-5" />}
          iconClassName="gradient-primary text-primary-foreground"
        />
        <StatCard
          title="Valor em Pipeline"
          value="R$ 24.800"
          trend={{ value: "+15% vs mês anterior", isPositive: true }}
          icon={<DollarSign className="h-5 w-5" />}
          iconClassName="bg-success/10 text-success"
        />
        <StatCard
          title="Propostas Enviadas"
          value="5"
          trend={{ value: "2 aguardando resposta", isPositive: true }}
          icon={<FileText className="h-5 w-5" />}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Taxa Conversão"
          value="23%"
          trend={{ value: "-5% vs média", isPositive: false }}
          icon={<TrendingUp className="h-5 w-5" />}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      {/* Meta Bimestral + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ProgressCard
          title="Meta Bimestral"
          current={25000}
          target={35000}
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
                <p className="text-xs text-muted-foreground">Meta: 3 clientes | Atual: 2</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">67%</p>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1">
                  <div className="h-full rounded-full bg-success" style={{ width: '67%' }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Faturamento Vendas</p>
                <p className="text-xs text-muted-foreground">Meta: R$ 15k | Atual: R$ 11k</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">73%</p>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1">
                  <div className="h-full rounded-full bg-primary" style={{ width: '73%' }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Target className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Taxa de Conversão</p>
                <p className="text-xs text-muted-foreground">Meta: 30% | Atual: 23%</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">77%</p>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1">
                  <div className="h-full rounded-full bg-warning" style={{ width: '77%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
