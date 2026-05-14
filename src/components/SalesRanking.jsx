import { useMemo } from "react";
import { Trophy, Medal, Star, TrendingUp, Users, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LEVELS = [
  { min: 0, label: "Rookie", color: "text-gray-500", bg: "bg-gray-100", emoji: "🌱" },
  { min: 5, label: "Prospector", color: "text-blue-600", bg: "bg-blue-50", emoji: "🔍" },
  { min: 15, label: "Vendedor", color: "text-green-600", bg: "bg-green-50", emoji: "💼" },
  { min: 30, label: "Experto", color: "text-purple-600", bg: "bg-purple-50", emoji: "⭐" },
  { min: 60, label: "Élite", color: "text-orange-600", bg: "bg-orange-50", emoji: "🔥" },
  { min: 100, label: "Leyenda", color: "text-red-600", bg: "bg-red-50", emoji: "🏆" },
];

function getLevel(score) {
  return [...LEVELS].reverse().find(l => score >= l.min) || LEVELS[0];
}

function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function SalesRanking({ commerces, clients }) {
  const ranking = useMemo(() => {
    const monthStart = getMonthStart();
    const executives = {};

    commerces.forEach(c => {
      const exec = c.assigned_executive || c.created_by || "Sin asignar";
      if (!executives[exec]) executives[exec] = { name: exec, visited: 0, converted: 0, total: 0, score: 0 };
      executives[exec].total++;
      if (c.status !== "nuevo") executives[exec].visited++;
      if (c.status === "convertido") executives[exec].converted++;
    });

    clients.forEach(cl => {
      const exec = cl.created_by || "Sin asignar";
      if (!executives[exec]) executives[exec] = { name: exec, visited: 0, converted: 0, total: 0, score: 0 };
    });

    return Object.values(executives)
      .map(e => ({
        ...e,
        score: e.visited * 1 + e.converted * 5 + e.total * 0.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [commerces, clients]);

  if (ranking.length === 0) return null;

  const podiumColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
  const podiumIcons = [Trophy, Medal, Star];

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-yellow-600" />
        </div>
        <div>
          <h2 className="font-semibold font-display text-sm">Ranking Mensual de Vendedores</h2>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Podium top 3 */}
      {ranking.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-5 pt-2">
          {[ranking[1], ranking[0], ranking[2]].map((exec, podiumIdx) => {
            const rank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
            const PIcon = podiumIcons[rank - 1];
            const level = getLevel(exec.score);
            const heights = ["h-20", "h-28", "h-16"];
            const podiumHeight = podiumIdx === 1 ? heights[0] : podiumIdx === 0 ? heights[1] : heights[2];
            return (
              <div key={exec.name} className="flex flex-col items-center gap-1 flex-1 max-w-[100px]">
                <span className="text-lg">{level.emoji}</span>
                <span className="text-xs font-semibold text-center truncate w-full text-center px-1">
                  {exec.name.split("@")[0].split(" ")[0]}
                </span>
                <span className={`text-xs font-bold ${podiumColors[rank - 1]}`}>
                  {Math.round(exec.score)} pts
                </span>
                <div className={`w-full ${podiumHeight} rounded-t-xl flex flex-col items-center justify-start pt-2 gap-1 ${
                  rank === 1 ? "bg-gradient-to-b from-yellow-400 to-yellow-500" :
                  rank === 2 ? "bg-gradient-to-b from-gray-300 to-gray-400" :
                  "bg-gradient-to-b from-amber-500 to-amber-600"
                }`}>
                  <PIcon className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">#{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranking list */}
      <div className="space-y-2">
        {ranking.map((exec, i) => {
          const level = getLevel(exec.score);
          const convRate = exec.total > 0 ? ((exec.converted / exec.total) * 100).toFixed(0) : 0;
          return (
            <div key={exec.name} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${i < 3 ? "bg-muted/40" : "hover:bg-muted/20"}`}>
              <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                #{i + 1}
              </span>
              <span className="text-base">{level.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{exec.name.split("@")[0]}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${level.bg} ${level.color}`}>
                    {level.label}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-1 hidden sm:flex">
                  <Users className="w-3 h-3" />
                  <span>{exec.visited}</span>
                </div>
                <div className="flex items-center gap-1 hidden sm:flex">
                  <Target className="w-3 h-3 text-green-500" />
                  <span className="text-green-600 font-medium">{exec.converted}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span className="font-semibold text-foreground">{Math.round(exec.score)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><Users className="w-3 h-3" /> Visitados</div>
        <div className="flex items-center gap-1"><Target className="w-3 h-3 text-green-500" /> Convertidos</div>
        <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-primary" /> Puntos totales</div>
      </div>
    </div>
  );
}