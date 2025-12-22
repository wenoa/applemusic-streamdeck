import { EncodedKeyImage } from "../../src/images/key-image";
import type { Catalog, CatalogSong } from "../../src/music/catalog/catalog";

export class FakeCatalog implements Catalog {
  private songsByStorefront = new Map<string, CatalogSong[]>();
  private searches = 0;
  private downloads = 0;
  private answer = async (artist: string, title: string, storefront: string) => this.songsFound(artist, title, storefront);

  withSong(storefront: string, song: CatalogSong) {
    this.songsByStorefront.set(storefront, [...this.songsIn(storefront), song]);

    return this;
  }

  becomesUnreachable() {
    this.answer = async () => {
      throw new Error("The catalog can't be reached");
    };

    return this;
  }

  becomesReachable() {
    this.answer = async (artist, title, storefront) => this.songsFound(artist, title, storefront);
  }

  async songsOfAlbum(artist: string, title: string, storefront: string) {
    this.searches += 1;

    return this.answer(artist, title, storefront);
  }

  searchesMade() {
    return this.searches;
  }

  // The tests use data URLs, so the image at a URL is the URL itself.
  async imageAt(url: string) {
    this.downloads += 1;

    return new EncodedKeyImage(url);
  }

  imagesDownloaded() {
    return this.downloads;
  }

  // Like Apple's search, it also answers songs of other albums of the artist and of albums with the same title.
  private songsFound(artist: string, title: string, storefront: string) {
    return this.songsIn(storefront).filter(song => song.artist === artist || song.album === title);
  }

  private songsIn(storefront: string) {
    return this.songsByStorefront.get(storefront) ?? [];
  }
}
