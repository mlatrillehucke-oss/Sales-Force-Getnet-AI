import { apiClient } from '@/api/client';

export const agentService = {
  // Listar todas las conversaciones
  listConversations: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      return await apiClient.get(`/agents/conversations?${params}`);
    } catch (error) {
      console.error('Error listing conversations:', error);
      throw error;
    }
  },

  // Obtener una conversación específica
  getConversation: async (conversationId) => {
    try {
      return await apiClient.get(`/agents/conversations/${conversationId}`);
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  },

  // Crear nueva conversación
  createConversation: async (metadata = {}) => {
    try {
      return await apiClient.post('/agents/conversations', {
        agent_name: metadata.agent_name || 'sales_agent',
        metadata,
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Añadir mensaje a conversación
  addMessage: async (conversationId, message) => {
    try {
      return await apiClient.post(
        `/agents/conversations/${conversationId}/messages`,
        message
      );
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  // Suscribirse a cambios en conversación (SSE o WebSocket)
  subscribeToConversation: (conversationId, onUpdate) => {
    // Implementación básica con polling
    const interval = setInterval(async () => {
      try {
        const conversation = await agentService.getConversation(conversationId);
        onUpdate(conversation);
      } catch (error) {
        console.error('Error subscribing to conversation:', error);
      }
    }, 2000); // Poll cada 2 segundos

    // Retornar función para desuscribirse
    return () => clearInterval(interval);
  },

  // Eliminar conversación
  deleteConversation: async (conversationId) => {
    try {
      return await apiClient.delete(`/agents/conversations/${conversationId}`);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  // Ejecutar agente con contexto
  executeAgent: async (agentName, prompt, context = {}) => {
    try {
      return await apiClient.post('/agents/execute', {
        agent_name: agentName,
        prompt,
        context,
      });
    } catch (error) {
      console.error('Error executing agent:', error);
      throw error;
    }
  },
};
