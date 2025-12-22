import { Listeners } from "../../core/listeners";
import type { KeyImage } from "../../images/key-image";
import type { NowPlayingKey } from "../../keys/now-playing-key";
import type { Album } from "../tracks/album";
import type { Catalog } from "./catalog";

interface CatalogCover {
  renderOn(aKey: NowPlayingKey): Promise<void>;
}

interface CatalogSearchResult extends CatalogCover {
  orElse(aSearch: () => Promise<CatalogSearchResult>): Promise<CatalogSearchResult>;
}

class SearchedCatalogCover implements CatalogCover {
  async renderOn(aKey: NowPlayingKey) {
    await aKey.showPause();
  }
}

class MissingCatalogCover implements CatalogSearchResult {
  async renderOn(aKey: NowPlayingKey) {
    await aKey.showPause();
  }

  async orElse(aSearch: () => Promise<CatalogSearchResult>) {
    return aSearch();
  }
}

class FoundCatalogCover implements CatalogSearchResult {
  constructor(private readonly image: KeyImage) {
  }

  async renderOn(aKey: NowPlayingKey) {
    await aKey.showArtwork(this.image);
  }

  async orElse() {
    return this;
  }
}

export class CatalogCovers {
  private covers = new Map<string, CatalogCover>();
  private readonly arrivalListeners = new Listeners();

  constructor(
    private readonly catalog: Catalog,
    private readonly storefronts: string[],
  ) {
  }

  // The Mac's locale looks like "es_AR": its country is the storefront of the catalog searched first.
  static forMacLocale(aCatalog: Catalog, aMacLocale: string) {
    const countries = /_([A-Z]{2})/.exec(aMacLocale)?.slice(1) ?? [];

    return new CatalogCovers(aCatalog, [...countries.map(country => country.toLowerCase()), "us"]);
  }

  whenCoverArrives(aListener: () => Promise<void>) {
    this.arrivalListeners.add(aListener);
  }

  async renderOn(aKey: NowPlayingKey, anAlbum: Album) {
    await (this.covers.get(anAlbum.identification()) ?? this.search(anAlbum)).renderOn(aKey);
  }

  private search(anAlbum: Album) {
    const searched = new SearchedCatalogCover();
    this.covers.set(anAlbum.identification(), searched);
    void this.coverOf(anAlbum).then(
      async cover => {
        this.covers.set(anAlbum.identification(), cover);
        await this.arrivalListeners.notify();
      },
      // The catalog couldn't be reached, so the album is looked up again the next time the key is rendered.
      () => this.covers.delete(anAlbum.identification()),
    );

    return searched;
  }

  private async coverOf(anAlbum: Album) {
    return this.storefronts.reduce<Promise<CatalogSearchResult>>(
      async (coverSoFar, storefront) => (await coverSoFar).orElse(async () => this.coverIn(storefront, anAlbum)),
      Promise.resolve(new MissingCatalogCover()),
    );
  }

  private async coverIn(aStorefront: string, anAlbum: Album) {
    const songs = await anAlbum.songsIn(this.catalog, aStorefront);
    const covers = await Promise.all(songs
      .filter(song => anAlbum.isReleasedAs(song))
      .slice(0, 1)
      .map(async song => new FoundCatalogCover(await this.catalog.imageAt(song.artworkUrl))));

    return covers[0] ?? new MissingCatalogCover();
  }
}
