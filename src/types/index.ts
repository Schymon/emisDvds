export interface Dvd {
  id: string
  tmdbId: number
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
  title: string
  originalTitle: string
  year: string
  posterPath: string | null
  overview: string
}
