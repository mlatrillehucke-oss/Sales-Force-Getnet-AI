import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Store, MessageSquare, Lightbulb, HelpCircle, Trophy, Hash, X, Search } from "lucide-react";
import { Link } from "react-router-dom";

const CHANNELS = [
  { id: "general", label: "General", icon: Hash, color: "text-blue-600", bg: "bg-blue-50", desc: "Conversación general del equipo" },
  { id: "estrategias", label: "Estrategias", icon: Lightbulb, color: "text-yellow-600", bg: "bg-yellow-50", desc: "Técnicas de cierre y ventas" },
  { id: "dudas", label: "Dudas", icon: HelpCircle, color: "text-purple-600", bg: "bg-purple-50", desc: "Preguntas sobre comercios" },
  { id: "logros", label: "Logros", icon: Trophy, color: "text-green-600", bg: "bg-green-50", desc: "Celebra tus conversiones" },
];

function MessageBubble({ msg, currentUser }) {
  const isOwn = msg.author_email === currentUser?.email;
  const time = msg.created_date
    ? new Date(msg.created_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} items-end mb-3`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${isOwn ? "bg-primary" : "bg-slate-500"}`}>
        {(msg.author_name || msg.author_email || "?")[0].toUpperCase()}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className="text-[11px] text-muted-foreground ml-1">{msg.author_name || msg.author_email?.split("@")[0]}</span>
        )}
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${isOwn ? "bg-primary text-white rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
          {msg.content}
          {msg.commerce_id && (
            <Link
              to={`/search?highlight=${msg.commerce_id}`}
              className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                isOwn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-primary/10 hover:bg-primary/20 text-primary"
              }`}
            >
              <Store className="w-3 h-3 shrink-0" />
              {msg.commerce_name || "Ver comercio"}
            </Link>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground mx-1">{time}</span>
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState("general");
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [commerces, setCommerces] = useState([]);
  const [linkedCommerce, setLinkedCommerce] = useState(null);
  const [commerceSearch, setCommerceSearch] = useState("");
  const [showCommerceSearch, setShowCommerceSearch] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Commerce.list("-created_date", 300).then(setCommerces).catch(() => {});
  }, []);

  useEffect(() => {
    setMessages([]);
    const load = async () => {
      const msgs = await base44.entities.Message.filter({ channel }, "created_date", 100);
      setMessages(msgs);
    };
    load();

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.channel !== channel) return;
      if (event.type === "create") setMessages(prev => [...prev, event.data]);
      if (event.type === "delete") setMessages(prev => prev.filter(m => m.id !== event.id));
    });
    return unsub;
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    await base44.entities.Message.create({
      content: text.trim(),
      channel,
      author_name: user.full_name || user.email.split("@")[0],
      author_email: user.email,
      commerce_id: linkedCommerce?.id || null,
      commerce_name: linkedCommerce?.name || null,
    });
    setText("");
    setLinkedCommerce(null);
    setSending(false);
    inputRef.current?.focus();
  };

  const filteredCommerces = commerces.filter(c =>
    c.name?.toLowerCase().includes(commerceSearch.toLowerCase()) ||
    c.city?.toLowerCase().includes(commerceSearch.toLowerCase())
  ).slice(0, 8);

  const activeChannel = CHANNELS.find(c => c.id === channel);

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold font-display tracking-tight">Mensajería del Equipo</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Comparte estrategias, dudas y logros con el equipo en tiempo real</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Channel sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Canales</p>
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setChannel(ch.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                channel === ch.id ? "bg-primary text-white font-medium shadow-sm" : "hover:bg-muted text-muted-foreground"
              }`}>
              <ch.icon className="w-4 h-4 shrink-0" />
              <span># {ch.label}</span>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col min-h-0 overflow-hidden">
          {/* Channel header */}
          <div className={`px-4 py-3 border-b border-border flex items-center gap-2 ${activeChannel?.bg}`}>
            <activeChannel.icon className={`w-4 h-4 ${activeChannel?.color}`} />
            <span className="font-semibold text-sm">#{activeChannel?.label}</span>
            <span className="text-xs text-muted-foreground">— {activeChannel?.desc}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Sé el primero en escribir en #{activeChannel?.label}</p>
              </div>
            )}
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} currentUser={user} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Linked commerce preview */}
          {linkedCommerce && (
            <div className="mx-4 mb-1 px-3 py-2 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-medium text-primary flex-1">{linkedCommerce.name} · {linkedCommerce.city}</span>
              <button onClick={() => setLinkedCommerce(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Commerce search dropdown */}
          {showCommerceSearch && (
            <div className="mx-4 mb-1 border border-border rounded-xl overflow-hidden shadow-lg bg-card z-10">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={commerceSearch}
                  onChange={e => setCommerceSearch(e.target.value)}
                  placeholder="Buscar comercio..."
                  className="flex-1 text-sm bg-transparent outline-none"
                />
                <button onClick={() => setShowCommerceSearch(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredCommerces.map(c => (
                  <button key={c.id} onClick={() => { setLinkedCommerce(c); setShowCommerceSearch(false); setCommerceSearch(""); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sm">
                    <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">{c.city}</span>
                  </button>
                ))}
                {filteredCommerces.length === 0 && (
                  <p className="text-xs text-muted-foreground px-3 py-3">Sin resultados</p>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-border flex items-center gap-2">
            <button
              onClick={() => setShowCommerceSearch(v => !v)}
              title="Enlazar comercio"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              <Store className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`Mensaje en #${activeChannel?.label}...`}
              className="flex-1 bg-muted rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button size="icon" onClick={handleSend} disabled={sending || !text.trim()} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}