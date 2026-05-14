import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import {
  Send, Bot, Plus, Trash2, MessageSquare, Loader2,
  MapPin, Route, TrendingUp, Target, Sparkles, Navigation
} from "lucide-react";

const ROUTE_TEMPLATES = [
  { label: "Ruta matutina optimizada", prompt: "Genera una ruta de visitas para hoy. Prioriza comercios sin terminal de pago, estado 'nuevo' o 'contactado', agrupados geográficamente. Incluye duración estimada y puntaje de conversión." },
  { label: "Zona de alta oportunidad", prompt: "Analiza todos los comercios y dime cuál zona tiene mayor concentración de oportunidades (sin terminal, alta facturación, estado nuevo). Propón una ruta para esa zona." },
  { label: "Seguimientos urgentes", prompt: "Identifica comercios contactados o 'interesado' sin avanzar. Genera ruta de seguimiento urgente ordenada por potencial económico." },
  { label: "Nuevos descubrimientos", prompt: "Lista los comercios más recientes del sistema. Analiza cuáles tienen mayor potencial para GETNET y propón ruta de visita priorizando los de alto impacto." },
];

const SUGGESTED_QUESTIONS = [
  { icon: Route, text: "Diseña una ruta optimizada para mañana considerando proximidad y probabilidad de conversión", color: "text-red-500" },
  { icon: Target, text: "¿Qué comercios sin terminal tienen mayor potencial económico ahora mismo?", color: "text-orange-500" },
  { icon: MapPin, text: "Analiza todas las zonas y dime dónde hay más oportunidades sin explotar", color: "text-blue-500" },
  { icon: TrendingUp, text: "Revisa el pipeline completo y propón las 5 acciones de mayor impacto esta semana", color: "text-green-500" },
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          }`}>
            {isUser ? (
              <p className="leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground"
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.tool_calls.map((tc, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span>{tc.name?.replace(/_/g, " ")}</span>
                {tc.status === "completed" && <span className="text-green-500 ml-auto">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-bold text-muted-foreground">Tú</span>
        </div>
      )}
    </div>
  );
}

export default function SalesAgentAI() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadConversations(); getLocation(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const unsub = base44.agents.subscribeToConversation(activeConv.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [activeConv?.id]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  };

  const loadConversations = async () => {
    try {
      const convs = await base44.agents.listConversations({ agent_name: "sales_agent" });
      setConversations(convs || []);
      if (convs?.length > 0) {
        selectConversation(convs[0]);
      }
    } catch (e) {}
    setLoadingConvs(false);
  };

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    const full = await base44.agents.getConversation(conv.id);
    setMessages(full.messages || []);
  };

  const newConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "sales_agent",
      metadata: { name: `Sesión ${new Date().toLocaleDateString("es-CL")}` }
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    setMessages([]);
  };

  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConv?.id === convId) { setActiveConv(null); setMessages([]); }
  };

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || sending) return;

    let conv = activeConv;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: "sales_agent",
        metadata: { name: content.slice(0, 40) }
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConv(conv);
    }

    setInput("");
    setSending(true);

    // Prepend location context if available
    let finalContent = content;
    if (userLocation) {
      finalContent = `[Ubicación del usuario: lat ${userLocation.lat.toFixed(4)}, lng ${userLocation.lng.toFixed(4)}]\n\n${content}`;
    }

    await base44.agents.addMessage(conv, { role: "user", content: finalContent });
    setSending(false);
  };

  const isTyping = messages.length > 0 && messages[messages.length - 1]?.role === "user";

  const sendRoute = (template) => sendMessage(template.prompt);

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0 -m-4 lg:-m-6">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-card border-r border-border flex flex-col hidden md:flex">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm font-display">Sales Agent AI</h2>
              <p className="text-xs text-muted-foreground">Experto en prospección</p>
            </div>
          </div>
          <Button onClick={newConversation} size="sm" className="w-full gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Nueva sesión
          </Button>
        </div>

        {/* Route templates */}
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Route className="w-3 h-3" /> Rutas rápidas
          </p>
          <div className="space-y-1">
            {ROUTE_TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => sendRoute(t)}
                className="w-full text-left text-xs px-2.5 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 hover:border-primary/30 transition-all flex items-center gap-2">
                <Target className="w-3 h-3 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {userLocation && (
          <div className="mx-3 mt-2 flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5 border border-green-200">
            <Navigation className="w-3 h-3" />
            <span>Ubicación activa</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors group ${
                activeConv?.id === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted/70 text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate">{conv.metadata?.name || "Sesión"}</span>
              <button
                onClick={(e) => deleteConversation(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <div className="bg-primary/5 rounded-lg p-2.5 space-y-1">
            <p className="text-xs font-semibold text-primary">Capacidades</p>
            {["Rutas de venta", "Análisis de zonas", "Estrategias", "Alertas de comercios"].map(cap => (
              <p key={cap} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />{cap}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Sales Agent AI</h3>
            <p className="text-xs text-muted-foreground">Experto en prospección comercial GETNET</p>
          </div>
          {userLocation && (
            <Badge variant="outline" className="ml-auto text-xs gap-1 text-green-600 border-green-300">
              <Navigation className="w-3 h-3" /> Geolocalizado
            </Badge>
          )}
          <Button size="sm" variant="outline" className="text-xs md:hidden" onClick={newConversation}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConv && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold font-display text-lg mb-1">Sales Agent AI</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Tu experto en prospección comercial. Pregúntame sobre rutas de venta, estrategias por zona, análisis de comercios y más.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.text)}
                    className="flex items-start gap-2.5 text-left p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-xs"
                  >
                    <q.icon className={`w-4 h-4 ${q.color} shrink-0 mt-0.5`} />
                    <span>{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {(sending || isTyping) && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card shrink-0">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Pregunta sobre rutas, estrategias, zonas comerciales..."
              className="flex-1 text-sm"
              disabled={sending}
            />
            <Button onClick={() => sendMessage()} disabled={!input.trim() || sending} size="icon">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-1.5">
            El agente tiene acceso a tu base de datos de comercios y clientes en tiempo real
            {userLocation && " · Ubicación activa para búsquedas locales"}
          </p>
        </div>
      </div>
    </div>
  );
}