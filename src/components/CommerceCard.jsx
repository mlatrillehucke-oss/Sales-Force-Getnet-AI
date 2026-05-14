import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const typeLabels = {
  supermercado: "Supermercado", bazar: "Bazar", bar: "Bar", restaurante: "Restaurante",
  "verdulería": "Verdulería", farmacia: "Farmacia", "ferretería": "Ferretería",
  tienda_ropa: "Tienda de Ropa", "peluquería": "Peluquería", "panadería": "Panadería",
  "carnicería": "Carnicería", "librería": "Librería", "electrónica": "Electrónica",
  "óptica": "Óptica", "floristería": "Floristería", "cafetería": "Cafetería",
  hotel: "Hotel", gimnasio: "Gimnasio", veterinaria: "Veterinaria", otro: "Otro"
};

const statusColors = {
  nuevo: "bg-blue-100 text-blue-700",
  contactado: "bg-yellow-100 text-yellow-700",
  interesado: "bg-emerald-100 text-emerald-700",
  "en_negociación": "bg-purple-100 text-purple-700",
  convertido: "bg-green-100 text-green-700",
  descartado: "bg-gray-100 text-gray-600"
};

const statusLabels = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  "en_negociación": "En Negociación", convertido: "Convertido", descartado: "Descartado"
};

export default function CommerceCard({ commerce, onStatusChange }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {commerce.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {typeLabels[commerce.type] || commerce.type}
          </p>
        </div>
        <Badge variant="secondary" className={cn("text-xs shrink-0 ml-2", statusColors[commerce.status])}>
          {statusLabels[commerce.status] || commerce.status}
        </Badge>
      </div>

      {commerce.address && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{commerce.address}, {commerce.city}</span>
        </div>
      )}
      {commerce.phone && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Phone className="w-3 h-3 shrink-0" />
          <span>{commerce.phone}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Badge variant="outline" className="text-xs">{commerce.country}</Badge>
        {commerce.priority === "alta" && (
          <Badge className="bg-red-100 text-red-700 text-xs">Prioridad Alta</Badge>
        )}
        <Link to={`/client-form?commerceId=${commerce.id}`} className="ml-auto">
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
            Gestionar <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}