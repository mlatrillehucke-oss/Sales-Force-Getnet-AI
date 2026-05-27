import { apiClient } from '@/api/client';

export const routeService = {
  // Crear nueva ruta
  create: async (data) => {
    try {
      return await apiClient.post('/routes', data);
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  },

  // Listar todas las rutas
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      return await apiClient.get(`/routes?${params}`);
    } catch (error) {
      console.error('Error listing routes:', error);
      throw error;
    }
  },

  // Obtener ruta específica
  get: async (id) => {
    try {
      return await apiClient.get(`/routes/${id}`);
    } catch (error) {
      console.error('Error getting route:', error);
      throw error;
    }
  },

  // Actualizar ruta
  update: async (id, data) => {
    try {
      return await apiClient.put(`/routes/${id}`, data);
    } catch (error) {
      console.error('Error updating route:', error);
      throw error;
    }
  },

  // Eliminar ruta
  delete: async (id) => {
    try {
      return await apiClient.delete(`/routes/${id}`);
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  },

  // Optimizar orden de visitas en ruta
  optimize: async (commerces, startingPoint) => {
    try {
      return await apiClient.post('/routes/optimize', {
        commerces,
        starting_point: startingPoint,
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw error;
    }
  },

  // Obtener sugerencias de rutas por zona
  suggestByZone: async (city, country) => {
    try {
      return await apiClient.get(
        `/routes/suggestions?city=${city}&country=${country}`
      );
    } catch (error) {
      console.error('Error getting route suggestions:', error);
      throw error;
    }
  },

  // Marcar ruta como completada
  complete: async (id) => {
    try {
      return await apiClient.put(`/routes/${id}/complete`, {});
    } catch (error) {
      console.error('Error completing route:', error);
      throw error;
    }
  },
};
