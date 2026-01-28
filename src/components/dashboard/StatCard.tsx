import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: ReactNode;
  iconClassName?: string;
  className?: string;
}

export function StatCard({ title, value, trend, icon, iconClassName, className }: StatCardProps) {
  return (
    <div className={cn("stat-card group", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="stat-label truncate">{title}</p>
          <p className="stat-value">{value}</p>
          {trend && (
            <div className={cn(trend.isPositive ? "stat-trend-up" : "stat-trend-down")}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 flex-shrink-0" />
              )}
              <span className="truncate">{trend.value}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg transition-transform flex-shrink-0 ml-2",
          iconClassName || "bg-primary/10 text-primary"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
