import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Loader2, Trash2, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons = {
  nuevo_comercio: "🏪", oportunidad: "🎯", seguimiento: "📋",
  ia_sugerencia: "🤖", sistema: "⚙️"
};
const typeLabels = {
  nuevo_comercio: "Nuevo Comercio", oportunidad: "Oportunidad", seguimiento: "Seguimiento",
  ia_sugerencia: "Sugerencia IA", sistema: "Sistema"
};
const priorityColors = {
  alta: "bg-red-100 text-red-700", media: "bg-yellow-100 text-yellow-700", baja: "bg-gray-100 text-gray-600"
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    const data = await base44.entities.Alert.list("-created_date", 100);
    setAlerts(data);
    setLoading(false);
  };

  const markRead = async (id) => {
    await base44.entities.Alert.update(id, { is_read: true });
    loadAlerts();
  };

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    await Promise.all(unread.map(a => base44.entities.Alert.update(a.id, { is_read: true })));
    loadAlerts();
  };

  const deleteAlert = async (id) => {
    await base44.entities.Alert.delete(id);
    loadAlerts();
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">Alertas</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount} sin leer de {alerts.length} totales</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCircle className="w-4 h-4" /> Marcar todas como leídas
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "bg-card rounded-2xl border p-4 transition-all duration-300",
              alert.is_read ? "border-border opacity-60" : "border-primary/30 shadow-sm"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{typeIcons[alert.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">{alert.title}</h3>
                  <Badge variant="outline" className="text-xs">{typeLabels[alert.type] || alert.type}</Badge>
                  <Badge className={cn("text-xs", priorityColors[alert.priority])}>{alert.priority}</Badge>
                </div>
                {alert.description && <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>}
                <p className="text-xs text-muted-foreground mt-1.5">
                  {new Date(alert.created_date).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!alert.is_read && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(alert.id)}>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAlert(alert.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <BellOff className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No tienes alertas. Las recibirás cuando haya nuevas oportunidades comerciales.</p>
        </div>
      )}
    </div>
  );
}