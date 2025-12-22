import type { Catalog, CatalogSong } from "../catalog/catalog";

export class Album {
  constructor(
    private readonly artist: string,
    private readonly title: string,
  ) {
  }

  async songsIn(aCatalog: Catalog, aStorefront: string) {
    return aCatalog.songsOfAlbum(this.artist, this.title, aStorefront);
  }

  identification() {
    return JSON.stringify([this.artist, this.title]);
  }

  isReleasedAs(aSong: CatalogSong) {
    return aSong.artist === this.artist && aSong.album === this.title;
  }
}
