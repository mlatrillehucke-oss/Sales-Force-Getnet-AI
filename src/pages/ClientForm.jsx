import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ClientForm() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("clientId");
  const commerceId = params.get("commerceId");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "", trade_name: "", tax_id: "", legal_representative: "",
    representative_id: "", address: "", city: "", country: "España",
    phone: "", email: "", business_type: "", monthly_revenue: "",
    num_employees: "", bank_name: "", bank_account: "", plan_type: "estándar",
    terminal_type: "portátil", services: [], contract_status: "pendiente",
    notes: "", data_consent: false, commerce_id: commerceId || "",
  });

  useEffect(() => {
    if (clientId) {
      setLoading(true);
      base44.entities.Client.filter({ id: clientId }).then((data) => {
        if (data.length > 0) {
          const c = data[0];
          setForm({
            ...c,
            monthly_revenue: c.monthly_revenue || "",
            num_employees: c.num_employees || "",
            services: c.services || [],
          });
        }
        setLoading(false);
      });
    }
    if (commerceId && !clientId) {
      base44.entities.Commerce.filter({ id: commerceId }).then((data) => {
        if (data.length > 0) {
          const c = data[0];
          setForm((f) => ({
            ...f,
            business_name: c.name || "",
            city: c.city || "",
            country: c.country || "España",
            phone: c.phone || "",
            email: c.email || "",
            address: c.address || "",
            commerce_id: c.id,
          }));
        }
      });
    }
  }, [clientId, commerceId]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.data_consent) {
      toast.error("El cliente debe aceptar el consentimiento de datos");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      monthly_revenue: form.monthly_revenue ? Number(form.monthly_revenue) : undefined,
      num_employees: form.num_employees ? Number(form.num_employees) : undefined,
      consent_date: form.data_consent ? new Date().toISOString() : undefined,
    };
    // Remove undefined and id/dates
    delete payload.id;
    delete payload.created_date;
    delete payload.updated_date;
    delete payload.created_by;

    if (clientId) {
      await base44.entities.Client.update(clientId, payload);
      toast.success("Cliente actualizado correctamente");
    } else {
      await base44.entities.Client.create(payload);
      toast.success("Cliente registrado correctamente");
      // Update commerce status
      if (form.commerce_id) {
        await base44.entities.Commerce.update(form.commerce_id, { status: "convertido" });
      }
    }
    setSaving(false);
    navigate("/clients");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/clients">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">
            {clientId ? "Editar Cliente" : "Nuevo Cliente"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Formulario de registro GETNET</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
        {/* Business Info */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-primary">Información del Negocio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Razón Social *</Label><Input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Nombre Comercial</Label><Input value={form.trade_name} onChange={(e) => update("trade_name", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">RUT / NIF / CIF *</Label><Input value={form.tax_id} onChange={(e) => update("tax_id", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Giro / Actividad Económica</Label><Input value={form.business_type} onChange={(e) => update("business_type", e.target.value)} className="mt-1" /></div>
          </div>
        </div>

        {/* Representative */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-primary">Representante Legal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Nombre Completo</Label><Input value={form.legal_representative} onChange={(e) => update("legal_representative", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">DNI / RUN</Label><Input value={form.representative_id} onChange={(e) => update("representative_id", e.target.value)} className="mt-1" /></div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-primary">Contacto y Ubicación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Dirección Fiscal</Label><Input value={form.address} onChange={(e) => update("address", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Ciudad</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-xs">País</Label>
              <Select value={form.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="España">España</SelectItem>
                  <SelectItem value="Chile">Chile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Teléfono</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1" /></div>
          </div>
        </div>

        {/* Financial */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-primary">Información Financiera</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Facturación Mensual (€)</Label><Input type="number" value={form.monthly_revenue} onChange={(e) => update("monthly_revenue", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Nº Empleados</Label><Input type="number" value={form.num_employees} onChange={(e) => update("num_employees", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Banco</Label><Input value={form.bank_name} onChange={(e) => update("bank_name", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">IBAN / Cuenta</Label><Input value={form.bank_account} onChange={(e) => update("bank_account", e.target.value)} className="mt-1" /></div>
          </div>
        </div>

        {/* GETNET Plan */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-primary">Plan GETNET</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Plan</Label>
              <Select value={form.plan_type} onValueChange={(v) => update("plan_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="básico">Básico</SelectItem>
                  <SelectItem value="estándar">Estándar</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de Terminal</Label>
              <Select value={form.terminal_type} onValueChange={(v) => update("terminal_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fijo">Fijo</SelectItem>
                  <SelectItem value="portátil">Portátil</SelectItem>
                  <SelectItem value="móvil">Móvil</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-xs">Observaciones</Label>
          <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="mt-1" rows={3} />
        </div>

        {/* Consent */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={form.data_consent}
              onCheckedChange={(v) => update("data_consent", v)}
              id="consent"
            />
            <label htmlFor="consent" className="text-xs leading-relaxed cursor-pointer">
              El cliente autoriza el tratamiento de sus datos personales conforme a la Ley 19.628 (Chile) y al Reglamento General de Protección de Datos (RGPD - UE 2016/679). Los datos serán utilizados exclusivamente para la gestión comercial de servicios GETNET y podrán ser revocados en cualquier momento. *
            </label>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || !form.business_name || !form.tax_id || !form.data_consent} className="w-full gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {clientId ? "Actualizar Cliente" : "Registrar Cliente"}
        </Button>
      </div>
    </div>
  );
}