import type { Dvd, TmdbSearchResult } from '@/types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Fehler (${res.status})`)
  }
  return res.json()
}

export function fetchDvds(): Promise<Dvd[]> {
  return request<Dvd[]>('/api/dvds')
}

export function createDvd(data: Omit<Dvd, 'id' | 'rating' | 'createdAt'>): Promise<Dvd> {
  return request<Dvd>('/api/dvds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateRating(id: string, rating: number): Promise<Dvd> {
  return request<Dvd>(`/api/dvds/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  })
}

export function deleteDvd(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/dvds/${id}`, { method: 'DELETE' })
}

export async function searchTmdb(query: string): Promise<TmdbSearchResult[]> {
  const data = await request<{ results: TmdbSearchResult[] }>(
    `/api/tmdb/search?q=${encodeURIComponent(query)}`,
  )
  return data.results
}

export function posterUrl(posterPath: string | null | undefined, size = 'w342'): string | null {
  if (!posterPath) return null
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}
