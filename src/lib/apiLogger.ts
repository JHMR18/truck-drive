// Utility to log detailed API information
export const logApiCall = (method: string, url: string, payload?: any) => {
  console.log(`[API] ${method} ${url}`, payload ? { payload } : '');
};

export const logApiResponse = (response: Response, data?: any) => {
  console.log(`[API Response] ${response.status} ${response.statusText}`, {
    url: response.url,
    ok: response.ok,
    status: response.status,
    data: data
  });
};

export const logApiError = (error: any, url?: string) => {
  console.error('[API Error]', {
    message: error.message,
    status: error.status,
    url: url,
    stack: error.stack,
    error: error
  });
};