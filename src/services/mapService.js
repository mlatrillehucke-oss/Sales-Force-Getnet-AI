import { apiClient } from '@/api/client';

export const mapService = {
  // Calcular distancia entre dos puntos (Haversine)
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radio terrestre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(lat1 * Math.PI / 180) * 
              Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // Generar ruta usando OSRM (Open Source Routing Machine)
  generateRoute: async (coordinates) => {
    try {
      if (!coordinates || coordinates.length < 2) {
        console.warn('Need at least 2 coordinates to generate a route');
        return null;
      }

      const coords = coordinates
        .map(p => `${p.longitude},${p.latitude}`)
        .join(";");

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      );

      if (!response.ok) {
        throw new Error(`OSRM Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.routes && data.routes[0]) {
        // Convertir coordenadas [lng, lat] a [lat, lng] para Leaflet
        return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      }

      return null;
    } catch (error) {
      console.error('Error generating route:', error);
      // Fallback: líneas rectas
      return coordinates.map(p => [p.latitude, p.longitude]);
    }
  },

  // Obtener direcciones alrededor de una ubicación
  getNearbyAddresses: async (lat, lng, radiusKm = 5) => {
    try {
      return await apiClient.get('/maps/nearby', {
        params: {
          lat,
          lng,
          radius: radiusKm,
        },
      });
    } catch (error) {
      console.error('Error getting nearby addresses:', error);
      throw error;
    }
  },

  // Geocodificar dirección a coordenadas
  geocodeAddress: async (address) => {
    try {
      return await apiClient.post('/maps/geocode', {
        address,
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  },

  // Reverse geocode: coordenadas a dirección
  reverseGeocode: async (lat, lng) => {
    try {
      return await apiClient.post('/maps/reverse-geocode', {
        lat,
        lng,
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  },

  // Filtrar comercios dentro de un radio
  filterByRadius: (commerces, centerLat, centerLng, radiusKm) => {
    return commerces.filter(commerce => {
      if (!commerce.latitude || !commerce.longitude) return false;
      const distance = mapService.calculateDistance(
        centerLat,
        centerLng,
        commerce.latitude,
        commerce.longitude
      );
      return distance <= radiusKm;
    });
  },
};
