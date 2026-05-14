import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const commerceTypes = [
  { value: "all", label: "Todos los tipos" },
  { value: "supermercado", label: "Supermercado" },
  { value: "bazar", label: "Bazar" },
  { value: "bar", label: "Bar" },
  { value: "restaurante", label: "Restaurante" },
  { value: "verdulería", label: "Verdulería" },
  { value: "farmacia", label: "Farmacia" },
  { value: "ferretería", label: "Ferretería" },
  { value: "tienda_ropa", label: "Tienda de Ropa" },
  { value: "peluquería", label: "Peluquería" },
  { value: "panadería", label: "Panadería" },
  { value: "carnicería", label: "Carnicería" },
  { value: "librería", label: "Librería" },
  { value: "electrónica", label: "Electrónica" },
  { value: "óptica", label: "Óptica" },
  { value: "floristería", label: "Floristería" },
  { value: "cafetería", label: "Cafetería" },
  { value: "hotel", label: "Hotel" },
  { value: "gimnasio", label: "Gimnasio" },
  { value: "veterinaria", label: "Veterinaria" },
  { value: "otro", label: "Otro" },
];

const countries = [
  { value: "all", label: "Todos los países" },
  { value: "España", label: "España" },
  { value: "Chile", label: "Chile" },
];

const statuses = [
  { value: "all", label: "Todos los estados" },
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "interesado", label: "Interesado" },
  { value: "en_negociación", label: "En Negociación" },
  { value: "convertido", label: "Convertido" },
  { value: "descartado", label: "Descartado" },
];

export default function CommerceFilters({ filters, onFilterChange, onClear }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs gap-1">
          <X className="w-3 h-3" /> Limpiar
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={filters.search || ""}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select value={filters.type || "all"} onValueChange={(v) => onFilterChange({ ...filters, type: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {commerceTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.country || "all"} onValueChange={(v) => onFilterChange({ ...filters, country: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={(v) => onFilterChange({ ...filters, status: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}