// Cliente HTTP genérico para todas las llamadas API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = {
  async get(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  },

  async post(endpoint, data, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  },

  async put(endpoint, data, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  },

  async delete(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  },
};
