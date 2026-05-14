import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Users, Search, Plus, FileText, Loader2, ArrowRight, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const contractStatusColors = {
  pendiente: "bg-yellow-100 text-yellow-700",
  "en_revisión": "bg-blue-100 text-blue-700",
  aprobado: "bg-emerald-100 text-emerald-700",
  activo: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const contractStatusLabels = {
  pendiente: "Pendiente", "en_revisión": "En Revisión",
  aprobado: "Aprobado", activo: "Activo", cancelado: "Cancelado",
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.Client.list("-created_date", 200).then((data) => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.business_name?.toLowerCase().includes(q) ||
      c.trade_name?.toLowerCase().includes(q) ||
      c.tax_id?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de clientes registrados en GETNET</p>
        </div>
        <Link to="/client-form">
          <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nuevo Cliente</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, RUT/NIF, ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Client list */}
      <div className="space-y-2">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{client.business_name}</h3>
                  {client.trade_name && (
                    <span className="text-xs text-muted-foreground">({client.trade_name})</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <span>{client.tax_id}</span>
                  {client.city && <span>{client.city}, {client.country}</span>}
                  {client.plan_type && <Badge variant="outline" className="text-xs">{client.plan_type}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", contractStatusColors[client.contract_status])}>
                  {contractStatusLabels[client.contract_status] || client.contract_status}
                </Badge>
                <Link to={`/client-report?clientId=${client.id}`}>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                    <FileText className="w-3 h-3" /> Informe
                  </Button>
                </Link>
                <Link to={`/client-form?clientId=${client.id}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    Editar <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hay clientes registrados aún.</p>
          <Link to="/client-form">
            <Button size="sm" className="mt-3 gap-1.5"><Plus className="w-4 h-4" /> Registrar Primer Cliente</Button>
          </Link>
        </div>
      )}
    </div>
  );
}