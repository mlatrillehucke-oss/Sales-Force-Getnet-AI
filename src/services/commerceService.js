import { apiClient } from '@/api/client';

export const commerceService = {
  // Reemplaza: base44.entities.Commerce.list()
  list: async (sortBy = '-created_date', limit = 500) => {
    try {
      return await apiClient.get('/commerces', { 
        params: new URLSearchParams({ sort: sortBy, limit }).toString() 
      });
    } catch (error) {
      console.error('Error listing commerces:', error);
      throw error;
    }
  },

  // Reemplaza: base44.entities.Commerce.create()
  create: async (data) => {
    try {
      return await apiClient.post('/commerces', data);
    } catch (error) {
      console.error('Error creating commerce:', error);
      throw error;
    }
  },

  // Reemplaza: base44.entities.Commerce.update()
  update: async (id, data) => {
    try {
      return await apiClient.put(`/commerces/${id}`, data);
    } catch (error) {
      console.error('Error updating commerce:', error);
      throw error;
    }
  },

  // Obtener un comercio por ID
  get: async (id) => {
    try {
      return await apiClient.get(`/commerces/${id}`);
    } catch (error) {
      console.error('Error getting commerce:', error);
      throw error;
    }
  },

  // Eliminar comercio
  delete: async (id) => {
    try {
      return await apiClient.delete(`/commerces/${id}`);
    } catch (error) {
      console.error('Error deleting commerce:', error);
      throw error;
    }
  },

  // Buscar comercios por filtros
  search: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      return await apiClient.get(`/commerces/search?${params}`);
    } catch (error) {
      console.error('Error searching commerces:', error);
      throw error;
    }
  },
};
