// ============================================================================
// BrokerOS — Centralized Typed API Client
// ============================================================================

export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
}

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
  if (envUrl.startsWith('http')) return envUrl;
  if (typeof window !== 'undefined') {
    return envUrl;
  }
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${envUrl}`;
};

function formatEndpoint(endpoint: string, params?: RequestOptions['params']): string {
  let url = endpoint;

  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    const base = getApiBaseUrl();
    if (base.endsWith('/api/proxy') && endpoint.startsWith('/api/proxy')) {
      const cleanBase = base.slice(0, -'/api/proxy'.length).replace(/\/+$/, '');
      url = `${cleanBase}${endpoint}`;
    } else if (base.startsWith('http') && !base.endsWith('/api/proxy') && endpoint.startsWith('/api/proxy/')) {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanEndpoint = endpoint.replace(/^\/api\/proxy/, '');
      url = `${cleanBase}${cleanEndpoint}`;
    } else {
      const cleanBase = base.replace(/\/+$/, '');
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      url = `${cleanBase}${cleanEndpoint}`;
    }
  }

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return url;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, headers: customHeaders, ...fetchOptions } = options;
  const url = formatEndpoint(endpoint, params);

  const headers = new Headers(customHeaders);

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;

  let requestBody: BodyInit | null = null;
  if (body !== undefined && body !== null) {
    if (isFormData || isBlob || typeof body === 'string') {
      requestBody = body;
    } else {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: requestBody,
    credentials: fetchOptions.credentials || 'include',
  });

  if (!response.ok) {
    let errorData: any = null;
    let errorMessage = response.statusText || 'Request failed';

    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = errorData.message || errorData.error || errorMessage;
      }
    } catch {
      // Non-JSON error body (e.g. HTML 502/504)
      errorData = await response.text().catch(() => null);
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      // Potential session expiration
      console.warn('[apiClient] 401 Unauthorized encountered at:', url);
    }

    throw new ApiError(errorMessage, response.status, response.statusText, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as unknown as T;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

// HTTP Verb convenience helpers
apiClient.get = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiClient<T>(endpoint, { ...options, method: 'POST', body });

apiClient.put = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiClient<T>(endpoint, { ...options, method: 'PUT', body });

apiClient.patch = <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
  apiClient<T>(endpoint, { ...options, method: 'PATCH', body });

apiClient.delete = <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });

export const api = apiClient;
export default apiClient;
