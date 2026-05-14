import { useState, useEffect, useCallback, useRef } from "react";
import PopulateCommerces from "../components/PopulateCommerces";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Loader2, MapPin, Navigation, ArrowRight, Route, X, Star,
  Phone, Globe, Clock, Sparkles, Plus, Trash2, Search, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createCustomIcon = (color = "#c0392b", selected = false) => L.divIcon({
  className: "",
  html: `<div style="
    width:${selected ? 36 : 28}px;height:${selected ? 36 : 28}px;
    background:${color};border:3px solid white;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35);
    transition:all 0.2s;
  "></div>`,
  iconSize: [selected ? 36 : 28, selected ? 36 : 28],
  iconAnchor: [selected ? 18 : 14, selected ? 36 : 28],
  popupAnchor: [0, selected ? -36 : -28],
});

const statusColors = {
  nuevo: "#3498db", contactado: "#f39c12", interesado: "#27ae60",
  en_negociación: "#8e44ad", convertido: "#2ecc71", descartado: "#95a5a6"
};

const mapPresets = {
  spain: { center: [40.4168, -3.7038], zoom: 6, label: "España" },
  chile: { center: [-33.4489, -70.6693], zoom: 5, label: "Chile" },
  madrid: { center: [40.4168, -3.7038], zoom: 13, label: "Madrid" },
  barcelona: { center: [41.3874, 2.1686], zoom: 13, label: "Barcelona" },
  sevilla: { center: [37.3886, -5.9953], zoom: 13, label: "Sevilla" },
  santiago: { center: [-33.4489, -70.6693], zoom: 13, label: "Santiago" },
  valparaiso: { center: [-33.0472, -71.6127], zoom: 13, label: "Valparaíso" },
};

const commerceTypes = [
  { value: "all", label: "Todos" },
  { value: "supermercado", label: "Supermercado" },
  { value: "restaurante", label: "Restaurante" },
  { value: "bar", label: "Bar" },
  { value: "cafetería", label: "Cafetería" },
  { value: "farmacia", label: "Farmacia" },
  { value: "ferretería", label: "Ferretería" },
  { value: "tienda_ropa", label: "Tienda Ropa" },
  { value: "peluquería", label: "Peluquería" },
  { value: "panadería", label: "Panadería" },
  { value: "hotel", label: "Hotel" },
  { value: "gimnasio", label: "Gimnasio" },
  { value: "óptica", label: "Óptica" },
  { value: "veterinaria", label: "Veterinaria" },
  { value: "electrónica", label: "Electrónica" },
  { value: "otro", label: "Otro" },
];

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom]);
  return null;
}

function RouteLayer({ routeCoords }) {
  if (!routeCoords || routeCoords.length < 2) return null;
  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{ color: "#c0392b", weight: 5, opacity: 0.85, dashArray: null }}
    />
  );
}

export default function MapView() {
  const [commerces, setCommerces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("spain");
  const [filterType, setFilterType] = useState("all");
  const [routeMode, setRouteMode] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedCommerce, setSelectedCommerce] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSearch, setAiSearch] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(mapPresets.spain.center);
  const [mapZoom, setMapZoom] = useState(mapPresets.spain.zoom);
  const [userLocation, setUserLocation] = useState(null);
  const [geoFilterActive, setGeoFilterActive] = useState(false);
  const [sectorFilter, setSectorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [terminalFilter, setTerminalFilter] = useState("all"); // all | sin_terminal | con_terminal
  const [minSalesFilter, setMinSalesFilter] = useState(0);
  const GEO_RADIUS_KM = 1.5;

  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const geoLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = [pos.coords.latitude, pos.coords.longitude];
      setUserLocation(loc);
      setMapCenter(loc);
      setMapZoom(15);
      setGeoFilterActive(true);
      setSectorFilter("");
    });
  };

  useEffect(() => { geoLocate(); }, []);

  useEffect(() => { loadCommerces(); }, []);

  const loadCommerces = async () => {
    const data = await base44.entities.Commerce.list("-created_date", 500);
    setCommerces(data);
    setLoading(false);
  };

  const changeRegion = (key) => {
    setSelectedRegion(key);
    const p = mapPresets[key];
    setMapCenter(p.center);
    setMapZoom(p.zoom);
  };

  const filtered = commerces.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (!c.latitude || !c.longitude) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (terminalFilter === "sin_terminal" && c.has_card_terminal === true) return false;
    if (terminalFilter === "con_terminal" && c.has_card_terminal !== true) return false;
    if (minSalesFilter > 0 && (c.estimated_monthly_sales || 0) < minSalesFilter) return false;
    if (geoFilterActive && userLocation) {
      const dist = haversineKm(userLocation[0], userLocation[1], c.latitude, c.longitude);
      if (dist > GEO_RADIUS_KM) return false;
    } else if (sectorFilter) {
      if (!(
        (c.city || "").toLowerCase().includes(sectorFilter.toLowerCase()) ||
        (c.region || "").toLowerCase().includes(sectorFilter.toLowerCase()) ||
        (c.address || "").toLowerCase().includes(sectorFilter.toLowerCase())
      )) return false;
    }
    return true;
  });

  const handleMarkerClick = async (commerce) => {
    setSelectedCommerce(commerce);
    setAiData(null);
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Busca información comercial detallada y actualizada sobre este negocio en ${commerce.city}, ${commerce.country}:
Nombre: "${commerce.name}"
Tipo: ${commerce.type}
Dirección conocida: ${commerce.address || "no especificada"}

Proporciona la información más precisa y actualizada posible, incluyendo:
- Dirección exacta con número, calle, código postal y ciudad
- Número de teléfono con prefijo de país
- Sitio web oficial (si existe)
- Horario de atención típico
- Descripción del negocio (2-3 oraciones)
- URL de una foto representativa del tipo de negocio en unsplash (usa https://images.unsplash.com/... con keywords relevantes, tamaño 400x250)
- Número de empleados estimado
- Valoración media estimada (del 1 al 5)
- Si probablemente tiene terminal de pago actualmente (true/false)
- Proveedor de pago probable si tiene terminal`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            address: { type: "string" },
            phone: { type: "string" },
            website: { type: "string" },
            hours: { type: "string" },
            description: { type: "string" },
            photo_url: { type: "string" },
            employees: { type: "number" },
            rating: { type: "number" },
            has_terminal: { type: "boolean" },
            current_provider: { type: "string" },
          }
        }
      });
      setAiData(result);
    } catch (e) {
      setAiData(null);
    }
    setAiLoading(false);
  };

  const toggleRoutePoint = (commerce) => {
    setRoutePoints(prev => {
      const exists = prev.find(p => p.id === commerce.id);
      if (exists) return prev.filter(p => p.id !== commerce.id);
      return [...prev, commerce];
    });
    setRouteCoords(null);
  };

  const generateRoute = async () => {
    if (routePoints.length < 2) return;
    setRouteLoading(true);
    try {
      const coords = routePoints.map(p => `${p.longitude},${p.latitude}`).join(";");
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes?.[0]) {
        const latlngs = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoords(latlngs);
        const first = routePoints[0];
        setMapCenter([first.latitude, first.longitude]);
        setMapZoom(14);
      }
    } catch (e) {
      // fallback: straight lines
      const latlngs = routePoints.map(p => [p.latitude, p.longitude]);
      setRouteCoords(latlngs);
    }
    setRouteLoading(false);
  };

  const handleAiSearch = async () => {
    if (!aiSearch.trim()) return;
    setAiSearchLoading(true);
    try {
      const preset = mapPresets[selectedRegion];
      const region = mapPresets[selectedRegion].label;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Eres un experto en comercios de ${region}. El usuario busca: "${aiSearch}".
        
Genera una lista de 8-12 comercios reales o representativos que podrían existir en ${region} que coincidan con esta búsqueda.
Para cada comercio busca información real y precisa: nombre real del negocio si existe, dirección real, coordenadas geográficas precisas dentro de ${region}.
Incluye variedad de zonas y barrios. Prioriza negocios sin terminal de pago o con proveedores que GETNET podría reemplazar.

IMPORTANTE: Las coordenadas deben ser precisas y estar DENTRO de la región ${region}.
Centro aproximado de la región: lat ${preset.center[0]}, lng ${preset.center[1]}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            commerces: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  phone: { type: "string" },
                  estimated_monthly_sales: { type: "number" },
                  has_card_terminal: { type: "boolean" },
                  current_provider: { type: "string" },
                  priority: { type: "string" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.commerces?.length > 0) {
        const newCommerces = [];
        for (const c of result.commerces) {
          if (!c.latitude || !c.longitude) continue;
          const created = await base44.entities.Commerce.create({
            name: c.name,
            type: c.type || "otro",
            address: c.address,
            city: c.city,
            country: mapPresets[selectedRegion].label === "Chile" ? "Chile" : "España",
            latitude: c.latitude,
            longitude: c.longitude,
            phone: c.phone,
            estimated_monthly_sales: c.estimated_monthly_sales,
            has_card_terminal: c.has_card_terminal || false,
            current_provider: c.current_provider,
            priority: c.priority || "media",
            notes: c.notes,
            source: "búsqueda_ia",
            status: "nuevo"
          });
          newCommerces.push(created);
        }
        setCommerces(prev => [...prev, ...newCommerces]);
        if (newCommerces.length > 0) {
          const first = newCommerces[0];
          setMapCenter([first.latitude, first.longitude]);
          setMapZoom(13);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setAiSearchLoading(false);
    setAiSearch("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-display tracking-tight">Mapa de Comercios</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{filtered.length} comercios georreferenciados</p>
        </div>
        <div className="flex gap-2">
          <PopulateCommerces onComplete={loadCommerces} />
          <Button
            size="sm"
            variant={routeMode ? "default" : "outline"}
            onClick={() => { setRouteMode(!routeMode); setRoutePoints([]); setRouteCoords(null); }}
            className="gap-1.5 text-xs"
          >
            <Route className="w-3.5 h-3.5" />
            {routeMode ? "Salir Ruta" : "Crear Ruta"}
          </Button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-card rounded-xl border border-border p-3 shrink-0 space-y-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <div className="flex flex-wrap gap-1">
            {Object.entries(mapPresets).map(([key, val]) => (
              <Button key={key} size="sm" variant={selectedRegion === key ? "default" : "outline"}
                onClick={() => changeRegion(key)} className="text-xs h-7 px-2">
                {val.label}
              </Button>
            ))}
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {commerceTypes.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Sector + Geo filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Filtrar por sector, barrio o ciudad..."
              value={sectorFilter}
              onChange={e => { setSectorFilter(e.target.value); setGeoFilterActive(false); }}
            />
          </div>
          <Button
            size="sm"
            variant={geoFilterActive ? "default" : "outline"}
            className="h-8 text-xs gap-1 shrink-0"
            onClick={() => {
              if (geoFilterActive) {
                setGeoFilterActive(false);
              } else {
                geoLocate();
              }
            }}
            title="Mostrar comercios en mi zona"
          >
            <Navigation className="w-3.5 h-3.5" />
            {geoFilterActive ? `Mi zona (${filtered.length})` : "Mi zona"}
          </Button>
        </div>

        {/* Status & Terminal filters */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground font-medium">Estado:</span>
          {[["all","Todos"],["nuevo","Nuevo"],["contactado","Contactado"],["interesado","Interesado"],["en_negociación","Negociación"],["convertido","Convertido"]].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === val ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50 text-muted-foreground"
              }`}>{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground font-medium">Terminal:</span>
          {[["all","Todos"],["sin_terminal","🎯 Sin terminal"],["con_terminal","Con terminal"]].map(([val, label]) => (
            <button key={val} onClick={() => setTerminalFilter(val)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                terminalFilter === val ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50 text-muted-foreground"
              }`}>{label}</button>
          ))}
          <span className="text-xs text-muted-foreground font-medium ml-2">Ventas mín:</span>
          {[[0,"Todas"],[1000,">1K"],[5000,">5K"],[10000,">10K"]].map(([val, label]) => (
            <button key={val} onClick={() => setMinSalesFilter(val)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                minSalesFilter === val ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50 text-muted-foreground"
              }`}>{label}</button>
          ))}
        </div>

        {/* AI Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Buscar con IA: 'bares sin datáfono en Madrid centro'..."
              value={aiSearch}
              onChange={e => setAiSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAiSearch()}
            />
          </div>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleAiSearch} disabled={aiSearchLoading}>
            {aiSearchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Buscar
          </Button>
        </div>

        {/* Route mode controls */}
        {routeMode && (
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
            <Route className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-primary font-medium flex-1">
              {routePoints.length === 0 ? "Haz clic en los marcadores para añadir paradas" :
                `${routePoints.length} parada(s) seleccionada(s)`}
            </span>
            {routePoints.length >= 2 && (
              <Button size="sm" className="h-6 text-xs" onClick={generateRoute} disabled={routeLoading}>
                {routeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generar Ruta"}
              </Button>
            )}
            {routePoints.length > 0 && (
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setRoutePoints([]); setRouteCoords(null); }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Map + Side panel */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 rounded-xl border border-border overflow-hidden shadow-md min-h-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <RouteLayer routeCoords={routeCoords} />
            {filtered.map((c) => {
              const isInRoute = routePoints.find(p => p.id === c.id);
              const color = statusColors[c.status] || "#3498db";
              return (
                <Marker
                  key={c.id}
                  position={[c.latitude, c.longitude]}
                  icon={createCustomIcon(isInRoute ? "#c0392b" : color, !!isInRoute)}
                  eventHandlers={{
                    click: () => {
                      if (routeMode) {
                        toggleRoutePoint(c);
                      } else {
                        handleMarkerClick(c);
                      }
                    }
                  }}
                >
                  {!routeMode && (
                    <Popup maxWidth={220}>
                      <div className="text-sm">
                        <p className="font-bold text-sm leading-tight">{c.name}</p>
                        <p className="text-gray-500 text-xs mb-1">{c.type} · {c.city}</p>
                        <button
                          onClick={() => handleMarkerClick(c)}
                          className="text-xs text-red-600 font-medium underline"
                        >
                          Ver detalle IA →
                        </button>
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Side panel */}
        {selectedCommerce && !routeMode && (
          <div className="w-80 shrink-0 bg-card rounded-xl border border-border overflow-y-auto flex flex-col shadow-lg">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-sm truncate flex-1">{selectedCommerce.name}</span>
              <button onClick={() => setSelectedCommerce(null)} className="text-muted-foreground hover:text-foreground ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo */}
            {aiData?.photo_url && (
              <div className="h-40 overflow-hidden">
                <img
                  src={aiData.photo_url}
                  alt={selectedCommerce.name}
                  className="w-full h-full object-cover"
                  onError={e => e.target.style.display = "none"}
                />
              </div>
            )}
            {aiLoading && !aiData?.photo_url && (
              <div className="h-32 bg-muted flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Enriqueciendo con IA...</p>
                </div>
              </div>
            )}

            <div className="p-3 space-y-3 flex-1">
              {/* Status & type */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{selectedCommerce.type}</Badge>
                <Badge variant="outline" className="text-xs">{selectedCommerce.country}</Badge>
                {selectedCommerce.priority === "alta" && (
                  <Badge className="bg-red-100 text-red-700 text-xs">Alta prioridad</Badge>
                )}
              </div>

              {/* Rating */}
              {aiData?.rating && (
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(aiData.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{aiData.rating?.toFixed(1)}</span>
                </div>
              )}

              {/* Description */}
              {aiLoading && !aiData && (
                <div className="space-y-1.5">
                  {[1,2,3].map(i => <div key={i} className="h-3 bg-muted rounded animate-pulse" />)}
                </div>
              )}
              {aiData?.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{aiData.description}</p>
              )}

              {/* Contact info */}
              <div className="space-y-1.5">
                {(aiData?.address || selectedCommerce.address) && (
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{aiData?.address || selectedCommerce.address}</span>
                  </div>
                )}
                {(aiData?.phone || selectedCommerce.phone) && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <a href={`tel:${aiData?.phone || selectedCommerce.phone}`} className="hover:underline">
                      {aiData?.phone || selectedCommerce.phone}
                    </a>
                  </div>
                )}
                {aiData?.website && (
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                    <a href={aiData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {aiData.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {aiData?.hours && (
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{aiData.hours}</span>
                  </div>
                )}
              </div>

              {/* Terminal info */}
              {aiData && (
                <div className={`rounded-lg p-2.5 text-xs ${aiData.has_terminal === false ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
                  {aiData.has_terminal === false ? (
                    <p className="text-green-700 font-medium">✓ Sin terminal detectado — oportunidad GETNET</p>
                  ) : (
                    <p className="text-orange-700">Terminal actual: <span className="font-medium">{aiData.current_provider || "proveedor desconocido"}</span></p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCommerce.latitude},${selectedCommerce.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 border-green-500 text-green-700 hover:bg-green-50">
                    <Navigation className="w-3 h-3" /> Navegar en Google Maps
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                </a>
                <div className="flex gap-2">
                  <Link to={`/client-form?commerceId=${selectedCommerce.id}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs gap-1">
                      Gestionar <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="text-xs gap-1"
                    onClick={() => { toggleRoutePoint(selectedCommerce); setRouteMode(true); }}>
                    <Plus className="w-3 h-3" /> Ruta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Route summary */}
      {routeMode && routePoints.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3 shrink-0">
          <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-primary" /> Paradas de la ruta
          </p>
          <div className="flex flex-wrap gap-1.5">
            {routePoints.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1 text-xs text-primary">
                <span className="font-bold">{i + 1}</span>
                <span>{p.name}</span>
                <button onClick={() => toggleRoutePoint(p)}><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}