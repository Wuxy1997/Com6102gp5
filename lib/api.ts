export async function fetchWithCredentials(url: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
  
  return fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

export async function get(url: string, options: RequestInit = {}) {
  return fetchWithCredentials(url, {
    ...options,
    method: 'GET',
  })
}

export async function post(url: string, data: any, options: RequestInit = {}) {
  return fetchWithCredentials(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function put(url: string, data: any, options: RequestInit = {}) {
  return fetchWithCredentials(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function del(url: string, options: RequestInit = {}) {
  return fetchWithCredentials(url, {
    ...options,
    method: 'DELETE',
  })
} 