import type { KeyImage } from "../../images/key-image";

export type CatalogSong = {
  artist: string;
  album: string;
  artworkUrl: string;
};

export interface Catalog {
  songsOfAlbum(anArtist: string, aTitle: string, aStorefront: string): Promise<CatalogSong[]>;

  imageAt(aUrl: string): Promise<KeyImage>;
}
