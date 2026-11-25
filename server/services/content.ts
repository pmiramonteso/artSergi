import { artworkSources } from '../../app/data/artworks'
import { currentCollection } from '../../app/data/collections'
import type { Database } from '../database/client'
import {
  createDbArtworkRepository,
  createStaticArtworkRepository,
  type ArtworkRepository,
} from '../repositories/artworks'
import {
  createDbCollectionRepository,
  createStaticCollectionRepository,
  type CollectionRepository,
} from '../repositories/collections'

export interface ContentRepositories {
  artworks: ArtworkRepository
  collections: CollectionRepository
  source: 'database' | 'static'
}

/** Database-backed content when available, otherwise the static seed content. */
export function contentRepositories(db: Database | null): ContentRepositories {
  if (db) {
    return {
      artworks: createDbArtworkRepository(db),
      collections: createDbCollectionRepository(db),
      source: 'database',
    }
  }
  return {
    artworks: createStaticArtworkRepository(artworkSources),
    collections: createStaticCollectionRepository([currentCollection]),
    source: 'static',
  }
}
