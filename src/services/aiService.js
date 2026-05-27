import { apiClient } from '@/api/client';

export const aiService = {
  // Reemplaza: base44.integrations.Core.InvokeLLM()
  invokeLLM: async (prompt, options = {}) => {
    try {
      return await apiClient.post('/ai/invoke', {
        prompt,
        model: options.model || 'gpt-4o',
        temperature: options.temperature || 0.7,
        response_json_schema: options.response_json_schema,
        add_context_from_internet: options.add_context_from_internet || false,
      });
    } catch (error) {
      console.error('Error invoking LLM:', error);
      throw error;
    }
  },

  // Para búsqueda de comercios con IA
  searchCommerces: async (query, region) => {
    try {
      return await apiClient.post('/ai/search-commerces', {
        query,
        region,
      });
    } catch (error) {
      console.error('Error searching commerces with AI:', error);
      throw error;
    }
  },

  // Para análisis de rutas
  analyzeRoute: async (commerces, city, country) => {
    try {
      return await apiClient.post('/ai/analyze-route', {
        commerces,
        city,
        country,
      });
    } catch (error) {
      console.error('Error analyzing route:', error);
      throw error;
    }
  },

  // Para estrategia de ventas
  generateStrategy: async (stats) => {
    try {
      return await apiClient.post('/ai/strategy', {
        stats,
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      throw error;
    }
  },

  // Para enriquecer datos de comercios
  enrichCommerce: async (commerce) => {
    try {
      return await apiClient.post('/ai/enrich-commerce', {
        commerce,
      });
    } catch (error) {
      console.error('Error enriching commerce:', error);
      throw error;
    }
  },
};
