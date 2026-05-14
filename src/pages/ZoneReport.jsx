import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Download, BarChart2, MapPin, TrendingUp, Target, CheckCircle } from "lucide-react";
import { jsPDF } from "jspdf";

const STATUS_LABELS = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  en_negociación: "En Negociación", convertido: "Convertido", descartado: "Descartado"
};

const PRIORITY_LABELS = { alta: "Alta", media: "Media", baja: "Baja" };

export default function ZoneReport() {
  const [commerces, setCommerces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCity, setSelectedCity] = useState("all");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Commerce.list("-created_date", 1000),
      base44.entities.VisitRoute.list("-created_date", 200),
    ]).then(([c, r]) => {
      setCommerces(c);
      setRoutes(r);
      setLoading(false);
    });
  }, []);

  const cities = ["all", ...Array.from(new Set(commerces.map(c => c.city).filter(Boolean))).sort()];

  const filtered = selectedCity === "all" ? commerces : commerces.filter(c => c.city === selectedCity);

  const getMetrics = (list) => {
    const total = list.length;
    const byStatus = {};
    Object.keys(STATUS_LABELS).forEach(s => { byStatus[s] = list.filter(c => c.status === s).length; });
    const converted = byStatus.convertido || 0;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;
    const withoutTerminal = list.filter(c => !c.has_card_terminal).length;
    const highPriority = list.filter(c => c.priority === "alta").length;
    const avgSales = list.filter(c => c.estimated_monthly_sales > 0).reduce((a, c, _, arr) =>
      a + c.estimated_monthly_sales / arr.length, 0);
    const topOpportunities = list
      .filter(c => !c.has_card_terminal && c.status !== "convertido" && c.status !== "descartado")
      .sort((a, b) => (b.estimated_monthly_sales || 0) - (a.estimated_monthly_sales || 0))
      .slice(0, 10);
    const cityRoutes = routes.filter(r => selectedCity === "all" || r.city === selectedCity);
    return { total, byStatus, converted, conversionRate, withoutTerminal, highPriority, avgSales, topOpportunities, cityRoutes };
  };

  const metrics = getMetrics(filtered);

  useEffect(() => {
    if (!loading) setPreview(metrics);
  }, [loading, selectedCity, commerces]);

  const generatePDF = () => {
    setGenerating(true);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const margin = 15;
    let y = 20;

    // Header
    doc.setFillColor(192, 57, 43);
    doc.rect(0, 0, W, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("GETNET · Reporte de Gestión por Zona", margin, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const zoneName = selectedCity === "all" ? "Todas las zonas" : selectedCity;
    doc.text(`Zona: ${zoneName}  ·  Fecha: ${new Date().toLocaleDateString("es-CL")}`, margin, 22);
    y = 40;

    // Summary boxes
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen Ejecutivo", margin, y);
    y += 7;

    const boxes = [
      { label: "Total Comercios", value: metrics.total },
      { label: "Convertidos", value: metrics.converted },
      { label: "Tasa Conversión", value: `${metrics.conversionRate}%` },
      { label: "Sin Terminal", value: metrics.withoutTerminal },
      { label: "Alta Prioridad", value: metrics.highPriority },
      { label: "Venta Media Est.", value: metrics.avgSales > 0 ? `€${Math.round(metrics.avgSales).toLocaleString()}` : "N/D" },
    ];

    const bw = (W - margin * 2 - 10) / 3;
    const bh = 18;
    boxes.forEach((b, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = margin + col * (bw + 5);
      const by = y + row * (bh + 4);
      doc.setFillColor(250, 248, 248);
      doc.setDrawColor(220, 180, 180);
      doc.roundedRect(bx, by, bw, bh, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(130, 80, 80);
      doc.text(b.label.toUpperCase(), bx + 3, by + 5);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(192, 57, 43);
      doc.text(String(b.value), bx + 3, by + 14);
    });
    y += 2 * (bh + 4) + 10;

    // Pipeline por estado
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Pipeline de Conversión", margin, y);
    y += 6;

    const statusColors = {
      nuevo: [52, 152, 219], contactado: [243, 156, 18], interesado: [39, 174, 96],
      en_negociación: [142, 68, 173], convertido: [46, 204, 113], descartado: [149, 165, 166]
    };

    Object.entries(metrics.byStatus).forEach(([status, count]) => {
      if (count === 0) return;
      const pct = metrics.total > 0 ? (count / metrics.total) : 0;
      const barW = (W - margin * 2 - 50) * pct;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(STATUS_LABELS[status], margin, y + 4);
      const [r, g, b] = statusColors[status] || [100, 100, 100];
      doc.setFillColor(r, g, b);
      doc.roundedRect(margin + 38, y, Math.max(barW, 2), 6, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text(`${count} (${(pct * 100).toFixed(0)}%)`, margin + 38 + Math.max(barW, 2) + 3, y + 4.5);
      y += 9;
    });
    y += 6;

    // Rutas de visita
    if (metrics.cityRoutes.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Rutas de Visita Registradas", margin, y);
      y += 6;

      metrics.cityRoutes.slice(0, 8).forEach(r => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const stops = r.commerce_ids?.length || 0;
        const statusLabel = { planificada: "Planificada", en_curso: "En Curso", completada: "Completada", cancelada: "Cancelada" }[r.status] || r.status;
        const date = r.planned_date ? new Date(r.planned_date).toLocaleDateString("es-CL") : "Sin fecha";
        doc.text(`• ${r.name}  —  ${stops} paradas  |  Estado: ${statusLabel}  |  ${date}`, margin + 3, y);
        y += 7;
        if (y > 260) { doc.addPage(); y = 20; }
      });
      y += 4;
    }

    // Top oportunidades
    if (metrics.topOpportunities.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Top Oportunidades Comerciales (sin terminal)", margin, y);
      y += 2;

      // Table header
      doc.setFillColor(240, 230, 230);
      doc.rect(margin, y, W - margin * 2, 8, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 40, 40);
      doc.text("Comercio", margin + 2, y + 5.5);
      doc.text("Ciudad", margin + 65, y + 5.5);
      doc.text("Tipo", margin + 95, y + 5.5);
      doc.text("Estado", margin + 120, y + 5.5);
      doc.text("Prioridad", margin + 148, y + 5.5);
      doc.text("Venta Est. €", margin + 165, y + 5.5);
      y += 9;

      metrics.topOpportunities.forEach((c, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(252, 250, 250); doc.rect(margin, y, W - margin * 2, 7, "F"); }
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const name = c.name?.length > 28 ? c.name.slice(0, 26) + "…" : c.name || "-";
        doc.text(name, margin + 2, y + 5);
        doc.text((c.city || "-").slice(0, 15), margin + 65, y + 5);
        doc.text((c.type || "-").slice(0, 14), margin + 95, y + 5);
        doc.text(STATUS_LABELS[c.status] || c.status || "-", margin + 120, y + 5);
        doc.text(PRIORITY_LABELS[c.priority] || "-", margin + 148, y + 5);
        doc.text(c.estimated_monthly_sales > 0 ? c.estimated_monthly_sales.toLocaleString() : "-", margin + 165, y + 5);
        y += 8;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.setFont("helvetica", "normal");
      doc.text(`Sales Force GETNET · Reporte generado el ${new Date().toLocaleString("es-CL")} · Página ${p} de ${pageCount}`, margin, 292);
    }

    const filename = `reporte_${zoneName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    setGenerating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Reportes por Zona</h1>
          <p className="text-muted-foreground text-sm mt-1">Genera y descarga informes PDF detallados por ciudad o zona</p>
        </div>
        <Button onClick={generatePDF} disabled={generating || filtered.length === 0} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Descargar PDF
        </Button>
      </div>

      {/* Zone selector */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Seleccionar zona</p>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecciona una ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las zonas ({commerces.length} comercios)</SelectItem>
              {cities.filter(c => c !== "all").map(c => (
                <SelectItem key={c} value={c}>{c} ({commerces.filter(x => x.city === c).length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="text-xs">{filtered.length} comercios en zona</Badge>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: BarChart2, label: "Total Comercios", value: metrics.total, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: CheckCircle, label: "Convertidos", value: metrics.converted, color: "text-green-600", bg: "bg-green-50" },
          { icon: TrendingUp, label: "Tasa Conversión", value: `${metrics.conversionRate}%`, color: "text-primary", bg: "bg-red-50" },
          { icon: Target, label: "Sin Terminal (oportunidades)", value: metrics.withoutTerminal, color: "text-orange-600", bg: "bg-orange-50" },
          { icon: FileText, label: "Alta Prioridad", value: metrics.highPriority, color: "text-purple-600", bg: "bg-purple-50" },
          { icon: MapPin, label: "Rutas Registradas", value: metrics.cityRoutes.length, color: "text-teal-600", bg: "bg-teal-50" },
        ].map((m, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-xl font-bold font-display">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Pipeline de Conversión
        </h2>
        <div className="space-y-3">
          {Object.entries(metrics.byStatus).map(([status, count]) => {
            const pct = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
            const colorMap = { nuevo: "bg-blue-500", contactado: "bg-yellow-500", interesado: "bg-green-500", en_negociación: "bg-purple-500", convertido: "bg-emerald-500", descartado: "bg-gray-400" };
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs w-28 text-muted-foreground shrink-0">{STATUS_LABELS[status]}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full ${colorMap[status]} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium w-16 text-right">{count} ({pct.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top opportunities */}
      {metrics.topOpportunities.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Top Oportunidades (sin terminal)
          </h2>
          <div className="space-y-2">
            {metrics.topOpportunities.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-xs font-bold text-primary w-5 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.type} · {c.city}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{STATUS_LABELS[c.status] || c.status}</Badge>
                {c.estimated_monthly_sales > 0 && (
                  <span className="text-xs font-semibold text-green-700 shrink-0">€{c.estimated_monthly_sales.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay comercios en esta zona todavía.</p>
        </div>
      )}
    </div>
  );
}