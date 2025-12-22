// Talks to Apple's public catalog over the network, so no test exercises it: the tests use FakeCatalog.
/* v8 ignore file -- @preserve */
import { EncodedKeyImage } from "../../images/key-image";
import type { Catalog } from "./catalog";

type SearchResult = {
  artistName?: unknown;
  collectionName?: unknown;
  artworkUrl100?: unknown;
};

export class AppleCatalog implements Catalog {
  // Apple's search is fuzzy: it also answers songs of other albums, so the caller keeps only the exact ones.
  async songsOfAlbum(anArtist: string, aTitle: string, aStorefront: string) {
    const query = new URLSearchParams({
      term: `${anArtist} ${aTitle}`,
      entity: "song",
      limit: "50",
      country: aStorefront,
    });
    const { results = [] } = await (await this.fetched(`https://itunes.apple.com/search?${query}`)).json() as { results?: SearchResult[] };

    return results.map(result => ({
      artist: String(result.artistName ?? ""),
      album: String(result.collectionName ?? ""),
      // Apple's image server scales the cover to the size in its URL, and keys are 144x144 pixels.
      artworkUrl: String(result.artworkUrl100 ?? "").replace("100x100bb", "144x144bb"),
    }));
  }

  async imageAt(aUrl: string) {
    const response = await this.fetched(aUrl);
    const image = Buffer.from(await response.arrayBuffer()).toString("base64");

    return new EncodedKeyImage(`data:${response.headers.get("content-type") ?? "image/jpeg"};base64,${image}`);
  }

  private async fetched(aUrl: string) {
    const response = await fetch(aUrl);

    if (!response.ok) {
      throw new Error(`Apple's catalog answered ${response.status} to ${aUrl}`);
    }

    return response;
  }
}
