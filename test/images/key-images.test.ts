import { describe, expect, it } from "vitest";
import { EnglishCaptions, SpanishCaptions } from "../../src/images/captions";
import { KeyImages } from "../../src/images/key-images";

describe("KeyImages", () => {
  it("speaks Spanish when Stream Deck does", () => {
    expect(KeyImages.inLanguage("es").closedMusic()).toEqual(new KeyImages(new SpanishCaptions()).closedMusic());
  });

  it("speaks English in any other language", () => {
    expect(KeyImages.inLanguage("de").unauthorizedMusic()).toEqual(new KeyImages(new EnglishCaptions()).unauthorizedMusic());
  });

  it.each([
    [new SpanishCaptions(), "Cerrado"],
    [new EnglishCaptions(), "Closed"],
  ])("says Music is closed", (captions, caption) => {
    expect(decodeURIComponent(new KeyImages(captions).closedMusic().dataUri())).toContain(`>${caption}</text>`);
  });

  it.each([
    [new SpanishCaptions(), "Sin permiso"],
    [new EnglishCaptions(), "No access"],
  ])("says it has no permission to control Music", (captions, caption) => {
    expect(decodeURIComponent(new KeyImages(captions).unauthorizedMusic().dataUri())).toContain(`>${caption}</text>`);
  });

  it.each([
    [new SpanishCaptions(), "Sin playlist"],
    [new EnglishCaptions(), "No playlist"],
  ])("says no playlist was chosen", (captions, caption) => {
    expect(decodeURIComponent(new KeyImages(captions).missingPlaylist().dataUri())).toContain(`>${caption}</text>`);
  });

  it("shortens long playlist names", () => {
    const image = new KeyImages(new EnglishCaptions()).playlistNamed("Paramore en Argentina 2023");

    expect(decodeURIComponent(image.dataUri())).toContain(">Paramore en…</text>");
  });

  it("counts emoji as single characters when shortening playlist names", () => {
    const image = new KeyImages(new EnglishCaptions()).playlistNamed("Rock 🇦🇷🇦🇷🇦🇷 Nacional");

    expect(decodeURIComponent(image.dataUri())).toContain(">Rock 🇦🇷🇦🇷🇦🇷 Na…</text>");
  });

  it("escapes playlist names so they can't break the image", () => {
    const image = new KeyImages(new EnglishCaptions()).playlistNamed("<R&B \"hits\">");

    expect(decodeURIComponent(image.dataUri())).toContain(">&lt;R&amp;B &quot;hits&quot;&gt;</text>");
  });
});
