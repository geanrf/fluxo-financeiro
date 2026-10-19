const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'
const TOKEN_KEY = 'finance.accessToken'

type ApiErrorPayload = {
  message?: string
  violations?: Array<{ field: string; message: string }>
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly violations: ApiErrorPayload['violations'] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function storeAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = getAccessToken()

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? ((await response.json()) as ApiErrorPayload | T)
    : undefined

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | undefined
    const validationMessage = errorPayload?.violations?.[0]?.message
    throw new ApiError(
      validationMessage ?? errorPayload?.message ?? 'Não foi possível concluir a operação.',
      response.status,
      errorPayload?.violations,
    )
  }

  return payload as T
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
}
