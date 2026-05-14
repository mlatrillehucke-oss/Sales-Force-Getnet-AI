import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Printer, Building2, User, MapPin, CreditCard, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function ClientReport() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("clientId");
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      base44.entities.Client.filter({ id: clientId }).then((data) => {
        if (data.length > 0) setClient(data[0]);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [clientId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!client) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No se encontró el cliente</p>
        <Link to="/clients"><Button variant="outline" className="mt-3">Volver a Clientes</Button></Link>
      </div>
    );
  }

  const planLabels = { "básico": "Básico", "estándar": "Estándar", premium: "Premium", enterprise: "Enterprise" };
  const terminalLabels = { fijo: "Fijo", "portátil": "Portátil", "móvil": "Móvil", virtual: "Virtual" };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/clients">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Informe del Cliente</h1>
            <p className="text-muted-foreground text-sm">{client.business_name}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 print:hidden">
          <Printer className="w-4 h-4" /> Imprimir
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border print:border-0 print:shadow-none">
        {/* Header */}
        <div className="p-5 border-b border-border bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">INFORME COMERCIAL GETNET</p>
              <h2 className="text-xl font-bold font-display mt-1">{client.business_name}</h2>
              {client.trade_name && <p className="text-sm text-muted-foreground">{client.trade_name}</p>}
            </div>
            <Badge className="text-xs">{client.contract_status}</Badge>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Section: Business */}
          <Section icon={Building2} title="Datos del Negocio">
            <Field label="Razón Social" value={client.business_name} />
            <Field label="Nombre Comercial" value={client.trade_name} />
            <Field label="RUT / NIF / CIF" value={client.tax_id} />
            <Field label="Actividad Económica" value={client.business_type} />
            <Field label="Facturación Mensual" value={client.monthly_revenue ? `€${client.monthly_revenue.toLocaleString()}` : null} />
            <Field label="Empleados" value={client.num_employees} />
          </Section>

          <Section icon={User} title="Representante Legal">
            <Field label="Nombre" value={client.legal_representative} />
            <Field label="DNI / RUN" value={client.representative_id} />
          </Section>

          <Section icon={MapPin} title="Contacto y Ubicación">
            <Field label="Dirección" value={client.address} />
            <Field label="Ciudad" value={client.city} />
            <Field label="País" value={client.country} />
            <Field label="Teléfono" value={client.phone} />
            <Field label="Email" value={client.email} />
          </Section>

          <Section icon={CreditCard} title="Plan GETNET">
            <Field label="Plan" value={planLabels[client.plan_type] || client.plan_type} />
            <Field label="Terminal" value={terminalLabels[client.terminal_type] || client.terminal_type} />
            <Field label="Banco" value={client.bank_name} />
            <Field label="IBAN / Cuenta" value={client.bank_account} />
            <Field label="Estado Contrato" value={client.contract_status} />
          </Section>

          {client.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Observaciones</p>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{client.notes}</p>
            </div>
          )}

          {/* Consent */}
          <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Protección de Datos</p>
            <p>Consentimiento otorgado: {client.data_consent ? "Sí" : "No"}</p>
            {client.consent_date && <p>Fecha: {new Date(client.consent_date).toLocaleDateString()}</p>}
            <p className="mt-1">Datos tratados conforme a la Ley 19.628 (Chile) y RGPD (UE 2016/679).</p>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border">
            Generado el {new Date().toLocaleDateString()} — GETNET Prospector Pro
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pl-6">{children}</div>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}