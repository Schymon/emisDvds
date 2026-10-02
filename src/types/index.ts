export type MediaType = 'movie' | 'tv'

export interface Dvd {
  id: string
  tmdbId: number
  mediaType?: MediaType
  ean?: string | null
  title: string
  originalTitle?: string
  year?: string
  posterPath?: string | null
  overview?: string
  rating: number
  createdAt: string
}

export interface TmdbSearchResult {
  tmdbId: number
  mediaType: MediaType
  title: string
  originalTitle: string
  year: string
  posterPath: string | null
  overview: string
}
