import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import StatCard from "../components/StatCard";
import SalesRanking from "../components/SalesRanking";
import CommerceCard from "../components/CommerceCard";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Store, Users, TrendingUp, Bell, ArrowRight, Brain, Map,
  Loader2, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const COLORS = ["hsl(220,70%,45%)", "hsl(170,60%,40%)", "hsl(35,90%,55%)", "hsl(280,60%,55%)", "hsl(0,75%,55%)", "hsl(210,15%,75%)"];

export default function Dashboard() {
  const [commerces, setCommerces] = useState([]);
  const [clients, setClients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [c, cl, al] = await Promise.all([
      base44.entities.Commerce.list("-created_date", 50),
      base44.entities.Client.list("-created_date", 50),
      base44.entities.Alert.filter({ is_read: false }, "-created_date", 10),
    ]);
    setCommerces(c);
    setClients(cl);
    setAlerts(al);
    setLoading(false);
  };

  const generateInsight = async () => {
    setLoadingInsight(true);
    const stats = {
      total_commerces: commerces.length,
      by_status: commerces.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {}),
      by_type: commerces.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {}),
      by_country: commerces.reduce((acc, c) => { acc[c.country] = (acc[c.country] || 0) + 1; return acc; }, {}),
      total_clients: clients.length,
    };
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un analista de ventas experto para GETNET (servicios de pago con datáfono). Analiza estas estadísticas del equipo comercial y da 3 insights accionables y una estrategia recomendada. Datos: ${JSON.stringify(stats)}. Responde en español.`,
      response_json_schema: {
        type: "object",
        properties: {
          insights: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } },
          strategy: { type: "string" },
          priority_action: { type: "string" }
        }
      }
    });
    setAiInsight(res);
    setLoadingInsight(false);
  };

  // Chart data
  const statusData = commerces.reduce((acc, c) => {
    const s = c.status || "nuevo";
    const existing = acc.find((x) => x.name === s);
    if (existing) existing.value++;
    else acc.push({ name: s, value: 1 });
    return acc;
  }, []);

  const typeData = Object.entries(
    commerces.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  const statusLabels = {
    nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
    "en_negociación": "Negociación", convertido: "Convertido", descartado: "Descartado"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const converted = commerces.filter(c => c.status === "convertido").length;
  const conversionRate = commerces.length > 0 ? Math.round((converted / commerces.length) * 100) : 0;
  const recentCommerces = commerces.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión comercial GETNET — España y Chile</p>
        </div>
        <div className="flex gap-2">
          <Link to="/search">
            <Button size="sm" className="gap-1.5">
              <Store className="w-4 h-4" /> Buscar Comercios
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard title="Comercios" value={commerces.length} icon={Store} subtitle="Registrados" />
        <StatCard title="Clientes" value={clients.length} icon={Users} subtitle="Contratados" />
        <StatCard title="Conversión" value={`${conversionRate}%`} icon={TrendingUp} subtitle="Tasa de éxito" />
        <StatCard title="Alertas" value={alerts.length} icon={Bell} subtitle="Sin leer" />
      </div>

      {/* AI Insights */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-accent" />
            </div>
            <h2 className="font-semibold font-display">Análisis IA</h2>
          </div>
          <Button size="sm" variant="outline" onClick={generateInsight} disabled={loadingInsight} className="gap-1.5">
            {loadingInsight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            Generar Análisis
          </Button>
        </div>

        {aiInsight ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiInsight.insights?.map((insight, i) => (
                <div key={i} className="bg-muted/50 rounded-xl p-3">
                  <p className="text-sm font-semibold mb-1">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
            {aiInsight.strategy && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-primary mb-1">Estrategia Recomendada</p>
                <p className="text-sm">{aiInsight.strategy}</p>
              </div>
            )}
            {aiInsight.priority_action && (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs font-semibold text-accent">Acción Prioritaria</p>
                </div>
                <p className="text-sm">{aiInsight.priority_action}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Pulsa "Generar Análisis" para obtener insights inteligentes basados en tus datos.</p>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Comercios por Tipo</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(220,70%,45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Pipeline de Ventas</h3>
          <div className="h-52 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => statusLabels[name] || name}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Sales Ranking */}
      <SalesRanking commerces={commerces} clients={clients} />

      {/* Recent Commerces */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold font-display">Comercios Recientes</h2>
          <Link to="/search">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentCommerces.map((c) => (
            <CommerceCard key={c.id} commerce={c} />
          ))}
        </div>
        {recentCommerces.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Store className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No hay comercios registrados. Usa la búsqueda IA para encontrar nuevos.</p>
          </div>
        )}
      </div>
    </div>
  );
}