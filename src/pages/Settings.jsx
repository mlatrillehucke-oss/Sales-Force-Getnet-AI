import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Clock, Bell, Palette, Shield, User, Save, CheckCircle,
  Moon, Sun, Monitor, ChevronRight
} from "lucide-react";

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

const DATE_FORMATS = [
  { value: "dd/mm/yyyy", label: "DD/MM/YYYY (España)" },
  { value: "mm/dd/yyyy", label: "MM/DD/YYYY (EE.UU.)" },
  { value: "yyyy-mm-dd", label: "YYYY-MM-DD (ISO)" },
];

const TIME_FORMATS = [
  { value: "24h", label: "24 horas (14:30)" },
  { value: "12h", label: "12 horas (2:30 PM)" },
];

const TIMEZONES = [
  { value: "Europe/Madrid", label: "Madrid (UTC+1/+2)" },
  { value: "America/Santiago", label: "Santiago de Chile (UTC-4/-3)" },
  { value: "UTC", label: "UTC" },
];

const THEMES = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

const defaultSettings = {
  language: "es",
  dateFormat: "dd/mm/yyyy",
  timeFormat: "24h",
  timezone: "America/Santiago",
  theme: "light",
  notifications: {
    new_commerce: true,
    opportunities: true,
    followup: true,
    ai_suggestions: true,
    weekly_report: false,
  },
  alerts: {
    sound: false,
    email: true,
    push: true,
  },
  display: {
    density: "normal",
    sidebar_collapsed: false,
    show_ranking: true,
    map_default_region: "spain",
  }
};

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("app_settings");
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch { return defaultSettings; }
  });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  const update = (path, value) => {
    setSettings(prev => {
      const parts = path.split(".");
      if (parts.length === 1) return { ...prev, [path]: value };
      return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } };
    });
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    { id: "general", label: "General", icon: Globe },
    { id: "datetime", label: "Fecha y Hora", icon: Clock },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "appearance", label: "Apariencia", icon: Palette },
    { id: "account", label: "Cuenta", icon: User },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">Personaliza la aplicación según tus preferencias</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Guardado" : "Guardar cambios"}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0 space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeSection === s.id
                  ? "bg-primary text-white font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              <s.icon className="w-4 h-4 shrink-0" />
              {s.label}
              {activeSection !== s.id && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-6 space-y-6">

          {activeSection === "general" && (
            <>
              <SectionTitle icon={Globe} title="Idioma y Región" />
              <SettingRow label="Idioma de la aplicación" description="Idioma principal de la interfaz">
                <RadioGroup value={settings.language} onChange={v => update("language", v)} options={LANGUAGES} />
              </SettingRow>
              <Divider />
              <SettingRow label="Región por defecto en el mapa" description="Vista inicial al abrir el mapa">
                <RadioGroup value={settings.display.map_default_region}
                  onChange={v => update("display.map_default_region", v)}
                  options={[
                    { value: "spain", label: "España" },
                    { value: "chile", label: "Chile" },
                    { value: "madrid", label: "Madrid" },
                    { value: "santiago", label: "Santiago" },
                  ]} />
              </SettingRow>
              <Divider />
              <SettingRow label="Mostrar ranking de vendedores" description="Muestra el ranking mensual en el Dashboard">
                <Toggle value={settings.display.show_ranking} onChange={v => update("display.show_ranking", v)} />
              </SettingRow>
            </>
          )}

          {activeSection === "datetime" && (
            <>
              <SectionTitle icon={Clock} title="Fecha y Hora" />
              <SettingRow label="Zona horaria" description="Zona horaria para mostrar fechas y horas">
                <RadioGroup value={settings.timezone} onChange={v => update("timezone", v)} options={TIMEZONES} />
              </SettingRow>
              <Divider />
              <SettingRow label="Formato de fecha" description="Cómo se muestran las fechas en la app">
                <RadioGroup value={settings.dateFormat} onChange={v => update("dateFormat", v)} options={DATE_FORMATS} />
              </SettingRow>
              <Divider />
              <SettingRow label="Formato de hora" description="Formato de 12 o 24 horas">
                <RadioGroup value={settings.timeFormat} onChange={v => update("timeFormat", v)} options={TIME_FORMATS} />
              </SettingRow>
            </>
          )}

          {activeSection === "notifications" && (
            <>
              <SectionTitle icon={Bell} title="Notificaciones" />
              <p className="text-xs text-muted-foreground -mt-3">Elige qué tipos de alertas quieres recibir</p>
              {[
                { key: "notifications.new_commerce", label: "Nuevos comercios detectados", description: "Cuando la IA encuentra nuevas oportunidades" },
                { key: "notifications.opportunities", label: "Oportunidades de conversión", description: "Comercios con alta probabilidad de cierre" },
                { key: "notifications.followup", label: "Recordatorios de seguimiento", description: "Comercios sin actividad reciente" },
                { key: "notifications.ai_suggestions", label: "Sugerencias de la IA", description: "Recomendaciones estratégicas automáticas" },
                { key: "notifications.weekly_report", label: "Reporte semanal", description: "Resumen de actividad cada lunes" },
              ].map(item => (
                <div key={item.key}>
                  <SettingRow label={item.label} description={item.description}>
                    <Toggle value={getNestedValue(settings, item.key)} onChange={v => update(item.key, v)} />
                  </SettingRow>
                  <Divider />
                </div>
              ))}
              <SectionTitle icon={Bell} title="Canales de alerta" />
              {[
                { key: "alerts.email", label: "Notificaciones por email" },
                { key: "alerts.push", label: "Notificaciones push en navegador" },
                { key: "alerts.sound", label: "Sonido de notificación" },
              ].map(item => (
                <div key={item.key}>
                  <SettingRow label={item.label}>
                    <Toggle value={getNestedValue(settings, item.key)} onChange={v => update(item.key, v)} />
                  </SettingRow>
                  <Divider />
                </div>
              ))}
            </>
          )}

          {activeSection === "appearance" && (
            <>
              <SectionTitle icon={Palette} title="Apariencia" />
              <SettingRow label="Tema de color" description="Aspecto visual de la aplicación">
                <div className="flex gap-2">
                  {THEMES.map(t => (
                    <button key={t.value} onClick={() => update("theme", t.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all ${
                        settings.theme === t.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/40"
                      }`}>
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </SettingRow>
              <Divider />
              <SettingRow label="Densidad de la interfaz" description="Compacta o espaciada">
                <RadioGroup value={settings.display.density} onChange={v => update("display.density", v)}
                  options={[{ value: "compact", label: "Compacta" }, { value: "normal", label: "Normal" }, { value: "comfortable", label: "Confortable" }]} />
              </SettingRow>
            </>
          )}

          {activeSection === "account" && (
            <>
              <SectionTitle icon={User} title="Cuenta y Sesión" />
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium">Información de la cuenta</p>
                <p className="text-xs text-muted-foreground">Gestiona tu cuenta desde el panel de administración de Base44. Los cambios de nombre, email y contraseña se realizan desde allí.</p>
              </div>
              <Divider />
              <SectionTitle icon={Shield} title="Seguridad" />
              <SettingRow label="Sesión activa" description="Tu sesión actual en este dispositivo">
                <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">Activa</Badge>
              </SettingRow>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// Helpers
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="font-semibold text-sm">{title}</h3>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="border-b border-border/60" />;
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-6" : "left-1"}`} />
    </button>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            value === opt.value ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50 text-muted-foreground"
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}