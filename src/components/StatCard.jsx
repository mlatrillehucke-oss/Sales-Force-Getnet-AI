import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className }) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-all duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <span className={cn(
              "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
              trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}