import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const VALID_TYPES = ["restaurante", "bar", "cafetería", "supermercado", "farmacia", "panadería",
  "peluquería", "ferretería", "tienda_ropa", "bazar", "carnicería", "verdulería",
  "óptica", "electrónica", "gimnasio", "hotel", "veterinaria", "floristería", "librería", "otro"];

// Overpass API amenity/shop → our types
const TAG_MAP = {
  restaurant: "restaurante", bar: "bar", cafe: "cafetería", pub: "bar",
  fast_food: "restaurante", food_court: "restaurante",
  supermarket: "supermercado", convenience: "supermercado",
  pharmacy: "farmacia", bakery: "panadería", hairdresser: "peluquería",
  hardware: "ferretería", clothes: "tienda_ropa", shoes: "tienda_ropa",
  department_store: "tienda_ropa", fashion: "tienda_ropa",
  butcher: "carnicería", greengrocer: "verdulería", optician: "óptica",
  electronics: "electrónica", mobile_phone: "electrónica",
  fitness_centre: "gimnasio", gym: "gimnasio",
  hotel: "hotel", hostel: "hotel", guest_house: "hotel",
  veterinary: "veterinaria", florist: "floristería",
  books: "librería", gift: "bazar", variety_store: "bazar",
  kiosk: "otro", general: "otro", donut: "panadería", ice_cream: "cafetería",
  laundry: "otro", dry_cleaning: "otro", tailor: "otro",
  bicycle: "otro", sports: "otro", toys: "otro", jewelry: "otro",
  beauty: "peluquería", cosmetics: "peluquería",
};

function osmTypeMap(tags) {
  const keys = ["amenity", "shop", "tourism", "craft", "leisure"];
  for (const k of keys) {
    if (tags[k] && TAG_MAP[tags[k]]) return TAG_MAP[tags[k]];
  }
  return "otro";
}

function isCommercial(tags) {
  const commercialKeys = ["amenity", "shop", "tourism", "craft", "office", "leisure"];
  return commercialKeys.some(k => tags[k]);
}

// Radius in meters for Overpass query
const RADIUS = 800;

async function fetchOverpass(lat, lng, radius) {
  const query = `
[out:json][timeout:25];
(
  node["amenity"](around:${radius},${lat},${lng});
  node["shop"](around:${radius},${lat},${lng});
  node["tourism"="hotel"](around:${radius},${lat},${lng});
  node["tourism"="hostel"](around:${radius},${lat},${lng});
  node["craft"](around:${radius},${lat},${lng});
  way["amenity"](around:${radius},${lat},${lng});
  way["shop"](around:${radius},${lat},${lng});
  way["tourism"="hotel"](around:${radius},${lat},${lng});
)->.all;
.all out center tags;
`;

  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!resp.ok) throw new Error(`Overpass error: ${resp.status}`);
  const data = await resp.json();
  return data.elements || [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { city, country, center_lat, center_lng, zone } = await req.json();

    if (!city || !zone || !center_lat || !center_lng) {
      return Response.json({ error: "city, zone, center_lat, center_lng are required" }, { status: 400 });
    }

    // Existing names to avoid duplicates
    const existing = await base44.asServiceRole.entities.Commerce.filter({ city }, "-created_date", 2000);
    const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));

    // Fetch real businesses from OpenStreetMap via Overpass API
    let elements = [];
    try {
      elements = await fetchOverpass(center_lat, center_lng, RADIUS);
    } catch (e) {
      // Fallback: try with smaller radius
      elements = await fetchOverpass(center_lat, center_lng, 400);
    }

    let created = 0;
    let skipped = 0;

    for (const el of elements) {
      const tags = el.tags || {};

      // Must have a name
      const name = tags.name || tags["name:es"] || tags["brand"];
      if (!name) { skipped++; continue; }
      if (!isCommercial(tags)) { skipped++; continue; }

      // Skip unnamed chains without local identity
      const nameKey = name.toLowerCase().trim();
      if (existingNames.has(nameKey)) { skipped++; continue; }

      // Get coordinates (way elements use center)
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) { skipped++; continue; }

      const type = osmTypeMap(tags);
      const address = [
        tags["addr:street"],
        tags["addr:housenumber"],
      ].filter(Boolean).join(" ") || "";

      const phone = tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "";

      // Heuristic: large chains likely have terminals
      const isChain = !!(tags.brand || tags.operator);
      const hasTerminal = isChain || ["supermercado", "hotel", "gimnasio", "farmacia"].includes(type);

      await base44.asServiceRole.entities.Commerce.create({
        name,
        type,
        address,
        city,
        country,
        region: zone,
        latitude: lat,
        longitude: lng,
        phone,
        has_card_terminal: hasTerminal,
        estimated_monthly_sales: 0,
        notes: `OSM id:${el.id} | Zona: ${zone}${tags.website ? " | " + tags.website : ""}`,
        source: "búsqueda_ia",
        status: "nuevo",
        priority: hasTerminal ? "media" : "alta",
      });

      existingNames.add(nameKey);
      created++;

      // Cap at 60 per zone to avoid overloading
      if (created >= 60) break;
    }

    return Response.json({ success: true, zone, city, created, skipped, total_found: elements.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});