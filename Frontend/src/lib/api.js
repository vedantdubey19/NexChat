const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

const api = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Try to refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          // Retry original request
          headers.Authorization = `Bearer ${data.accessToken}`;
          const retryRes = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
          return retryRes.json();
        }
      } catch {
        // Refresh failed
      }
    }

    // Clear tokens and redirect
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
    throw new Error('Authentication failed');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Helper methods
export const get = (endpoint) => api(endpoint);
export const post = (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const put = (endpoint, body) => api(endpoint, { method: 'PUT', body: JSON.stringify(body) });
export const del = (endpoint) => api(endpoint, { method: 'DELETE' });

export default api;
