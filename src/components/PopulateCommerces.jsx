import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Database, Sparkles, CheckCircle, MapPin, ChevronDown, ChevronUp, Navigation } from "lucide-react";

const CITIES_CONFIG = [
  { city: "Madrid", country: "España", center: [40.4168, -3.7038], zones: ["Sol y Centro", "Malasaña", "Chueca", "Lavapiés", "Salamanca", "Chamberí", "Arganzuela", "Vallecas", "Carabanchel", "Tetuán", "Moncloa", "Vicálvaro", "Barajas", "Moratalaz"] },
  { city: "Barcelona", country: "España", center: [41.3874, 2.1686], zones: ["Gràcia", "Eixample", "Born", "Barceloneta", "Sants", "Poblenou", "Sarrià", "Horta", "Sant Andreu", "Les Corts", "Nou Barris", "Gràcia", "Sant Martí"] },
  { city: "Sevilla", country: "España", center: [37.3886, -5.9953], zones: ["Triana", "Centro", "Nervión", "Alameda", "Macarena", "Los Remedios", "Bellavista", "Este"] },
  { city: "Valencia", country: "España", center: [39.4699, -0.3763], zones: ["Ruzafa", "El Carmen", "Benimaclet", "Campanar", "Patraix", "Torrefiel", "Jesús", "Quatre Carreres"] },
  { city: "Bilbao", country: "España", center: [43.263, -2.9349], zones: ["Casco Viejo", "Ensanche", "Deusto", "Begoña", "Txurdinaga"] },
  { city: "Málaga", country: "España", center: [36.7213, -4.4214], zones: ["Centro", "La Malagueta", "El Palo", "Cruz de Humilladero"] },
  { city: "Santiago", country: "Chile", center: [-33.4489, -70.6693], zones: ["Providencia", "Ñuñoa", "Santiago Centro", "Las Condes", "Recoleta", "Barrio Italia", "Bellavista", "Vitacura", "La Florida", "Puente Alto", "Maipú", "San Miguel", "Peñalolén"] },
  { city: "Valparaíso", country: "Chile", center: [-33.0472, -71.6127], zones: ["Cerro Alegre", "Cerro Concepción", "Plan Valparaíso", "Viña del Mar", "Playa Ancha", "Puerto"] },
  { city: "Concepción", country: "Chile", center: [-36.8201, -73.0444], zones: ["Centro", "Barrio Universitario", "San Pedro", "Hualpén"] },
  { city: "Antofagasta", country: "Chile", center: [-23.6509, -70.3954], zones: ["Centro", "La Chimba", "Coviefi"] },
];

export default function PopulateCommerces({ onComplete }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [totalCreated, setTotalCreated] = useState(0);
  const [done, setDone] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const handleGeoSearch = async () => {
    if (!userLocation) {
      setGeoLoading(true);
      navigator.geolocation.getCurrentPosition(async pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        await runGeoSearch(loc);
        setGeoLoading(false);
      }, () => setGeoLoading(false));
      return;
    }
    setGeoLoading(true);
    await runGeoSearch(userLocation);
    setGeoLoading(false);
  };

  const runGeoSearch = async (loc) => {
    setRunning(true);
    setDone(false);
    setLogs([]);
    setTotalCreated(0);
    setProgress({ done: 0, total: 1 });
    addLog("📍 Buscando comercios en tu ubicación actual...", "info");
    try {
      const res = await base44.functions.invoke("populateCommerces", {
        city: "Mi Ubicación",
        country: "Local",
        center_lat: loc.lat,
        center_lng: loc.lng,
        zone: `Zona lat:${loc.lat.toFixed(3)},lng:${loc.lng.toFixed(3)}`
      });
      const created = res.data?.created || 0;
      setTotalCreated(created);
      addLog(`✓ ${created} comercios encontrados en tu zona`, "success");
      setProgress({ done: 1, total: 1 });
      if (onComplete) onComplete();
    } catch (e) {
      addLog(`✗ Error: ${e.message}`, "error");
    }
    setRunning(false);
    setDone(true);
  };

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev.slice(-30), { msg, type, ts: Date.now() }]);
  };

  const handleStart = async () => {
    const citiesToProcess = selectedCity
      ? CITIES_CONFIG.filter(c => c.city === selectedCity)
      : CITIES_CONFIG;

    const allTasks = citiesToProcess.flatMap(c =>
      c.zones.map(z => ({ ...c, zone: z }))
    );

    setRunning(true);
    setDone(false);
    setLogs([]);
    setTotalCreated(0);
    setProgress({ done: 0, total: allTasks.length });

    let created = 0;
    // Process in batches of 3 in parallel
    const BATCH = 3;
    for (let i = 0; i < allTasks.length; i += BATCH) {
      const batch = allTasks.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(task =>
          base44.functions.invoke("populateCommerces", {
            city: task.city,
            country: task.country,
            center_lat: task.center[0],
            center_lng: task.center[1],
            zone: task.zone
          })
        )
      );

      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        const task = batch[j];
        if (r.status === "fulfilled" && r.value?.data?.created !== undefined) {
          const c = r.value.data.created;
          created += c;
          setTotalCreated(prev => prev + c);
          addLog(`✓ ${task.city} - ${task.zone}: ${c} comercios`, "success");
        } else {
          addLog(`✗ ${task.city} - ${task.zone}: error`, "error");
        }
        setProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }
    }

    setRunning(false);
    setDone(true);
    if (onComplete) onComplete();
  };

  const resetState = () => {
    setRunning(false);
    setDone(false);
    setLogs([]);
    setProgress({ done: 0, total: 0 });
    setTotalCreated(0);
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
        onClick={() => { resetState(); setOpen(true); }}
      >
        <Database className="w-3.5 h-3.5" />
        Poblar con IA
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!running) setOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Poblar mapa con Comercios Reales
            </DialogTitle>
          </DialogHeader>

          {!running && !done && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-1">
                <Button
                  onClick={handleGeoSearch}
                  variant="outline"
                  className="flex-1 gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
                  disabled={geoLoading}
                >
                  {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  {userLocation ? "Buscar en mi ubicación" : "Usar mi ubicación"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                La IA buscará en internet comercios reales
              </p>

              <div>
                <p className="text-xs font-medium mb-2">Seleccionar ciudad:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCity(null)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!selectedCity ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"}`}
                  >
                    Todas ({CITIES_CONFIG.reduce((a, c) => a + c.zones.length, 0)} zonas)
                  </button>
                  {CITIES_CONFIG.map(c => (
                    <button
                      key={c.city}
                      onClick={() => setSelectedCity(c.city)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCity === c.city ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {c.city} ({c.zones.length} zonas)
                    </button>
                  ))}
                </div>
              </div>

              {!selectedCity && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">⚠️ Poblar todas las ciudades puede tardar 5-10 minutos. Se recomienda una ciudad a la vez para resultados más rápidos.</p>
                </div>
              )}

              <Button onClick={handleStart} className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Iniciar búsqueda {selectedCity ? `en ${selectedCity}` : "global"}
              </Button>
            </div>
          )}

          {running && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="relative mx-auto w-14 h-14 mb-3">
                  <Loader2 className="w-14 h-14 animate-spin text-primary/20 absolute" />
                  <Sparkles className="w-7 h-7 text-primary absolute top-3.5 left-3.5 animate-pulse" />
                </div>
                <p className="font-medium text-sm">Buscando comercios en las calles...</p>
                <p className="text-xs text-muted-foreground mt-1">{totalCreated} comercios encontrados hasta ahora</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progreso</span>
                  <span>{progress.done}/{progress.total} zonas</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                {logs.slice(-15).map((l, i) => (
                  <p key={i} className={`text-xs font-mono ${l.type === "error" ? "text-red-500" : "text-green-600"}`}>
                    {l.msg}
                  </p>
                ))}
                {logs.length === 0 && <p className="text-xs text-muted-foreground">Iniciando...</p>}
              </div>
            </div>
          )}

          {done && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-700 text-lg">{totalCreated} comercios añadidos</p>
                  <p className="text-xs text-green-600">El mapa ahora tiene mucho más datos de comercios reales</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 max-h-52 overflow-y-auto space-y-1">
                {logs.map((l, i) => (
                  <p key={i} className={`text-xs font-mono ${l.type === "error" ? "text-red-500" : "text-green-600"}`}>
                    {l.msg}
                  </p>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={resetState}>
                  Buscar más
                </Button>
                <Button size="sm" className="flex-1 text-xs" onClick={() => setOpen(false)}>
                  Ver en mapa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}