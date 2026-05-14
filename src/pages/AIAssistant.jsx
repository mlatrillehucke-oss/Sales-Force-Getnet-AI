import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Loader2, Route, BarChart3, Target, Sparkles, MapPin, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function AIAssistant() {
  const [commerces, setCommerces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Route planner
  const [routeCity, setRouteCity] = useState("");
  const [routeCountry, setRouteCountry] = useState("España");
  const [routeResult, setRouteResult] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Strategy
  const [strategyResult, setStrategyResult] = useState(null);
  const [strategyLoading, setStrategyLoading] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    base44.entities.Commerce.list("-created_date", 200).then((data) => {
      setCommerces(data);
      setLoading(false);
    });
  }, []);

  const generateRoute = async () => {
    if (!routeCity) return;
    setRouteLoading(true);
    const cityCommerces = commerces.filter(c => c.city?.toLowerCase() === routeCity.toLowerCase() && c.country === routeCountry);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un planificador de rutas comerciales experto para vendedores de GETNET (terminales de pago / datáfonos).
      
Ciudad: ${routeCity}, ${routeCountry}
Comercios registrados en esta zona: ${JSON.stringify(cityCommerces.map(c => ({ name: c.name, type: c.type, status: c.status, address: c.address })))}

Genera un plan de ruta optimizado para visitar comercios en esta ciudad. Si hay comercios registrados, inclúyelos. 
Además, sugiere zonas comerciales clave de ${routeCity} donde buscar nuevos prospectos.
Incluye: orden de visitas, tiempo estimado, zonas recomendadas, y tips de venta para cada tipo de comercio.
Responde en español con formato markdown.`,
      add_context_from_internet: true,
      model: "gemini_3_flash"
    });
    setRouteResult(res);
    setRouteLoading(false);

    // Save route
    await base44.entities.VisitRoute.create({
      name: `Ruta ${routeCity} - ${new Date().toLocaleDateString()}`,
      city: routeCity, country: routeCountry,
      ai_generated: true, ai_notes: typeof res === "string" ? res : JSON.stringify(res),
      status: "planificada",
      commerce_ids: cityCommerces.map(c => c.id)
    });
    toast.success("Ruta guardada");
  };

  const generateStrategy = async () => {
    setStrategyLoading(true);
    const stats = {
      total: commerces.length,
      by_country: commerces.reduce((a, c) => { a[c.country] = (a[c.country] || 0) + 1; return a; }, {}),
      by_status: commerces.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {}),
      by_type: commerces.reduce((a, c) => { a[c.type] = (a[c.type] || 0) + 1; return a; }, {}),
      with_terminal: commerces.filter(c => c.has_card_terminal).length,
      high_priority: commerces.filter(c => c.priority === "alta").length,
    };
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un director comercial experto en servicios de pago (GETNET). Analiza estos datos del equipo de ventas y genera:
1. Análisis completo del pipeline
2. Estadísticas clave con porcentajes
3. 5 estrategias concretas para mejorar conversión
4. Plan de acción semanal recomendado
5. Tipos de comercio con mayor probabilidad de conversión
6. Recomendaciones específicas para España y Chile

Datos: ${JSON.stringify(stats)}
Responde en español con formato markdown, bien organizado con títulos y bullets.`,
    });
    setStrategyResult(res);
    setStrategyLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    const context = {
      commerces_count: commerces.length,
      by_status: commerces.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {}),
      recent: commerces.slice(0, 5).map(c => ({ name: c.name, type: c.type, city: c.city, status: c.status })),
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un asistente de ventas IA experto para GETNET (terminales de pago y servicios financieros).
Contexto del equipo: ${JSON.stringify(context)}
Historial: ${chatMessages.map(m => `${m.role}: ${m.content}`).join('\n')}
Usuario: ${userMsg}

Responde de forma útil, concreta y en español. Si te preguntan sobre comercios, zonas o estrategias, usa el contexto.`,
    });

    setChatMessages(prev => [...prev, { role: "assistant", content: res }]);
    setChatLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">Asistente IA</h1>
        <p className="text-muted-foreground text-sm mt-1">Inteligencia artificial para optimizar tu prospección comercial</p>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="chat" className="gap-1.5 text-xs"><Brain className="w-3.5 h-3.5" /> Chat IA</TabsTrigger>
          <TabsTrigger value="routes" className="gap-1.5 text-xs"><Route className="w-3.5 h-3.5" /> Rutas</TabsTrigger>
          <TabsTrigger value="strategy" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Estrategia</TabsTrigger>
        </TabsList>

        {/* Chat */}
        <TabsContent value="chat">
          <div className="bg-card rounded-2xl border border-border flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: 400 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Pregúntame sobre comercios, zonas, estrategias de venta o cualquier cosa relacionada con GETNET.</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {["¿Qué zonas recomiendas en Madrid?", "Estrategia para bares", "¿Cómo mejorar mi tasa de conversión?"].map(q => (
                      <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => { setChatInput(q); }}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1"
                />
                <Button onClick={sendChat} disabled={chatLoading} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Routes */}
        <TabsContent value="routes">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-semibold font-display">Planificador de Rutas</h2>
            </div>
            <p className="text-sm text-muted-foreground">La IA generará una ruta optimizada para visitar comercios y zonas comerciales clave.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={routeCity} onChange={(e) => setRouteCity(e.target.value)} placeholder="Ciudad (ej: Madrid, Santiago)" className="flex-1" />
              <Select value={routeCountry} onValueChange={setRouteCountry}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="España">España</SelectItem>
                  <SelectItem value="Chile">Chile</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={generateRoute} disabled={routeLoading} className="gap-1.5">
                {routeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
                Generar Ruta
              </Button>
            </div>
            {routeResult && (
              <div className="bg-muted/50 rounded-xl p-4 mt-3">
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {typeof routeResult === "string" ? routeResult : JSON.stringify(routeResult)}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Strategy */}
        <TabsContent value="strategy">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-semibold font-display">Estrategia de Ventas</h2>
              </div>
              <Button onClick={generateStrategy} disabled={strategyLoading} className="gap-1.5">
                {strategyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generar Estrategia
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Análisis completo de tu pipeline con recomendaciones personalizadas.</p>
            {strategyResult && (
              <div className="bg-muted/50 rounded-xl p-4">
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {typeof strategyResult === "string" ? strategyResult : JSON.stringify(strategyResult)}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}