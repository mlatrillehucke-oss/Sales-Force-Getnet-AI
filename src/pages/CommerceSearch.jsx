import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import CommerceFilters from "../components/CommerceFilters";
import CommerceCard from "../components/CommerceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Brain, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";

export default function CommerceSearch() {
  const [commerces, setCommerces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [newCommerce, setNewCommerce] = useState({
    name: "", type: "otro", country: "España", city: "", address: "",
    phone: "", email: "", contact_person: "", notes: ""
  });

  useEffect(() => { loadCommerces(); }, []);

  const loadCommerces = async () => {
    const data = await base44.entities.Commerce.list("-created_date", 200);
    setCommerces(data);
    setLoading(false);
  };

  const filtered = commerces.filter((c) => {
    if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.type && filters.type !== "all" && c.type !== filters.type) return false;
    if (filters.country && filters.country !== "all" && c.country !== filters.country) return false;
    if (filters.status && filters.status !== "all" && c.status !== filters.status) return false;
    return true;
  });

  const handleAddCommerce = async () => {
    await base44.entities.Commerce.create(newCommerce);
    toast.success("Comercio añadido correctamente");
    setShowAdd(false);
    setNewCommerce({ name: "", type: "otro", country: "España", city: "", address: "", phone: "", email: "", contact_person: "", notes: "" });
    loadCommerces();
  };

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiSearching(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un experto en prospección comercial para GETNET (terminales de pago). El usuario busca: "${aiQuery}". 
      Genera una lista de 5-8 tipos de comercios reales que podrían existir en España o Chile y que serían buenos candidatos para vender terminales de pago GETNET.
      Para cada uno incluye: nombre sugerido del comercio, tipo, ciudad sugerida, país, y una razón por la que sería buen candidato.
      Responde en español.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                city: { type: "string" },
                country: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          search_tip: { type: "string" }
        }
      },
      add_context_from_internet: true,
      model: "gemini_3_flash"
    });
    setAiResults(res);
    setAiSearching(false);
  };

  const addAISuggestion = async (s) => {
    await base44.entities.Commerce.create({
      name: s.name, type: s.type, city: s.city, country: s.country,
      source: "búsqueda_ia", notes: s.reason, status: "nuevo"
    });
    toast.success(`"${s.name}" añadido a comercios`);
    loadCommerces();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">Buscar Comercios</h1>
          <p className="text-muted-foreground text-sm mt-1">Encuentra y registra nuevos comercios para GETNET</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Añadir Comercio</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo Comercio</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Nombre *</Label>
                <Input value={newCommerce.name} onChange={(e) => setNewCommerce({ ...newCommerce, name: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo *</Label>
                  <Select value={newCommerce.type} onValueChange={(v) => setNewCommerce({ ...newCommerce, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["supermercado","bazar","bar","restaurante","verdulería","farmacia","ferretería","tienda_ropa","peluquería","panadería","carnicería","librería","electrónica","óptica","floristería","cafetería","hotel","gimnasio","veterinaria","otro"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">País *</Label>
                  <Select value={newCommerce.country} onValueChange={(v) => setNewCommerce({ ...newCommerce, country: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="España">España</SelectItem>
                      <SelectItem value="Chile">Chile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Ciudad</Label><Input value={newCommerce.city} onChange={(e) => setNewCommerce({ ...newCommerce, city: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Teléfono</Label><Input value={newCommerce.phone} onChange={(e) => setNewCommerce({ ...newCommerce, phone: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Dirección</Label><Input value={newCommerce.address} onChange={(e) => setNewCommerce({ ...newCommerce, address: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Email</Label><Input value={newCommerce.email} onChange={(e) => setNewCommerce({ ...newCommerce, email: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Contacto</Label><Input value={newCommerce.contact_person} onChange={(e) => setNewCommerce({ ...newCommerce, contact_person: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Notas</Label><Textarea value={newCommerce.notes} onChange={(e) => setNewCommerce({ ...newCommerce, notes: e.target.value })} className="mt-1" rows={2} /></div>
              <Button onClick={handleAddCommerce} disabled={!newCommerce.name} className="w-full">Guardar Comercio</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Search */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-semibold font-display">Búsqueda Inteligente con IA</h2>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ej: 'restaurantes en Madrid que no acepten tarjeta' o 'tiendas de barrio en Santiago'"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
            className="flex-1"
          />
          <Button onClick={handleAISearch} disabled={aiSearching} className="gap-1.5 shrink-0">
            {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Buscar
          </Button>
        </div>

        {aiResults && (
          <div className="mt-4 space-y-3">
            {aiResults.search_tip && (
              <p className="text-xs text-muted-foreground bg-white/50 rounded-lg p-2">{aiResults.search_tip}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiResults.suggestions?.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.type} — {s.city}, {s.country}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addAISuggestion(s)} className="shrink-0 h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Añadir
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <CommerceFilters filters={filters} onFilterChange={setFilters} onClear={() => setFilters({})} />

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <CommerceCard key={c.id} commerce={c} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Store className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No se encontraron comercios. Usa la búsqueda IA o añade uno manualmente.</p>
        </div>
      )}
    </div>
  );
}