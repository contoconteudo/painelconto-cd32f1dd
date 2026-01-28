import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ObjectivesCard } from "@/components/dashboard/ObjectivesCard";
import { useLeads } from "@/hooks/useLeads";
import { useClients } from "@/hooks/useClients";
import { useObjectives } from "@/hooks/useObjectives";
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Star,
} from "lucide-react";

export default function Dashboard() {
  const { getPipelineStats } = useLeads();
  const { getStats: getClientStats } = useClients();
  const { objectives } = useObjectives();

  const leadStats = getPipelineStats();
  const clientStats = getClientStats();

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral das metas e operação comercial">
      {/* KPI Cards - Focados em Metas e CRM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
        <StatCard
          title="NPS Médio"
          value={clientStats.avgNPS.toString()}
          trend={{ 
            value: clientStats.avgNPS >= 8 ? "Excelente" : clientStats.avgNPS >= 6 ? "Bom" : "Precisa melhorar", 
            isPositive: clientStats.avgNPS >= 7 
          }}
          icon={<Star className="h-5 w-5" />}
          iconClassName="bg-accent/10 text-accent-foreground"
        />
      </div>

      {/* Objetivos Estratégicos */}
      <div className="mb-6">
        <ObjectivesCard />
      </div>

      {/* Resumo de Dados */}
      {(leadStats.totalLeads === 0 && clientStats.activeCount === 0 && objectives.length === 0) && (
        <div className="stat-card text-center py-8">
          <p className="text-muted-foreground">
            Nenhum dado cadastrado ainda. Comece adicionando leads no CRM, clientes ou objetivos estratégicos.
          </p>
        </div>
      )}
    </AppLayout>
  );
}
