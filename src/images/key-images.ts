import type { Captions } from "./captions";
import { EnglishCaptions, SpanishCaptions } from "./captions";
import { SvgKeyImage } from "./key-image";

// Apple Music's branding is black and white since macOS 27.2.
const FOREGROUND = "#FFFFFF";
const BACKGROUND = "#000000";
const MUTED = "#8E8E93";
const DIMMED = "#48484A";
const FONT = "-apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif";
const HEART = "M72 112 C72 112 28 84 28 56 C28 42 39 32 52 32 C61 32 68 37 72 44 C76 37 83 32 92 32 C105 32 116 42 116 56 C116 84 72 112 72 112 Z";
const LONGEST_PLAYLIST_NAME = 12;

class KeyLabel {
  constructor(private readonly text: string) {
  }

  shortenedTo(aLongestLength: number) {
    const characters = [...new Intl.Segmenter().segment(this.text)].map(character => character.segment);

    if (characters.length <= aLongestLength) {
      return this;
    }

    return new KeyLabel(`${characters.slice(0, aLongestLength - 1).join("").trim()}…`);
  }

  svg(aSize: number, aWeight: number) {
    return `<text x="72" y="124" text-anchor="middle" font-family="${FONT}" font-size="${aSize}" font-weight="${aWeight}" fill="${FOREGROUND}">${this.escaped()}</text>`;
  }

  private escaped() {
    return this.text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;");
  }
}

export class KeyImages {
  constructor(private readonly captions: Captions) {
  }

  static inLanguage(aLanguage: string) {
    const captionsByLanguage = new Map<string, Captions>([["es", new SpanishCaptions()]]);

    return new KeyImages(captionsByLanguage.get(aLanguage) ?? new EnglishCaptions());
  }

  closedMusic() {
    return this.framed(`
      <circle cx="54" cy="74" r="13" fill="${MUTED}"/>
      <circle cx="94" cy="66" r="13" fill="${MUTED}"/>
      <path d="M63 74 V30 L103 22 V66" stroke="${MUTED}" stroke-width="8" fill="none" stroke-linejoin="round"/>
      ${this.statusLabel(this.captions.closedMusic())}
    `);
  }

  unauthorizedMusic() {
    return this.framed(`
      <path d="M56 54 V42 A16 16 0 0 1 88 42 V54" stroke="${MUTED}" stroke-width="8" fill="none"/>
      <rect x="44" y="52" width="56" height="42" rx="8" fill="${MUTED}"/>
      ${this.statusLabel(this.captions.unauthorizedMusic())}
    `);
  }

  play() {
    return this.framed(`<path d="M54 38 L108 72 L54 106 Z" fill="${FOREGROUND}" stroke="${FOREGROUND}" stroke-width="8" stroke-linejoin="round"/>`);
  }

  pause() {
    return this.framed(`
      <rect x="44" y="38" width="20" height="68" rx="5" fill="${FOREGROUND}"/>
      <rect x="80" y="38" width="20" height="68" rx="5" fill="${FOREGROUND}"/>
    `);
  }

  nextTrack() {
    return this.framed(`
      <path d="M38 42 L84 72 L38 102 Z" fill="${FOREGROUND}" stroke="${FOREGROUND}" stroke-width="6" stroke-linejoin="round"/>
      <rect x="92" y="40" width="14" height="64" rx="4" fill="${FOREGROUND}"/>
    `);
  }

  previousTrack() {
    return this.framed(`
      <rect x="38" y="40" width="14" height="64" rx="4" fill="${FOREGROUND}"/>
      <path d="M106 42 L60 72 L106 102 Z" fill="${FOREGROUND}" stroke="${FOREGROUND}" stroke-width="6" stroke-linejoin="round"/>
    `);
  }

  favorite() {
    return this.framed(`<path d="${HEART}" fill="${FOREGROUND}"/>`);
  }

  notFavorite() {
    return this.framed(`<path d="${HEART}" fill="none" stroke="${FOREGROUND}" stroke-width="8"/>`);
  }

  favoriteWithoutTrack() {
    return this.framed(`<path d="${HEART}" fill="none" stroke="${DIMMED}" stroke-width="8"/>`);
  }

  volumeChange(aCaption: string) {
    return this.framed(`
      ${this.speaker()}
      ${new KeyLabel(aCaption).svg(34, 700)}
    `);
  }

  invalidVolumeChange() {
    return this.volumeChange("?");
  }

  playlistNamed(aName: string) {
    const label = new KeyLabel(aName).shortenedTo(LONGEST_PLAYLIST_NAME);

    return this.framed(`
      <rect x="36" y="30" width="54" height="9" rx="4.5" fill="${FOREGROUND}"/>
      <rect x="36" y="48" width="54" height="9" rx="4.5" fill="${FOREGROUND}"/>
      <rect x="36" y="66" width="34" height="9" rx="4.5" fill="${FOREGROUND}"/>
      <circle cx="94" cy="78" r="10" fill="${FOREGROUND}"/>
      <path d="M100 78 V40 L110 44" stroke="${FOREGROUND}" stroke-width="6" fill="none" stroke-linejoin="round"/>
      ${label.svg(18, 600)}
    `);
  }

  missingPlaylist() {
    return this.playlistNamed(this.captions.missingPlaylist());
  }

  private statusLabel(aText: string) {
    return new KeyLabel(aText).svg(22, 600);
  }

  private speaker() {
    return `
      <path d="M40 40 H54 L74 24 V84 L54 68 H40 Z" fill="${FOREGROUND}" stroke="${FOREGROUND}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M86 40 Q96 54 86 68" stroke="${FOREGROUND}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M96 30 Q112 54 96 78" stroke="${FOREGROUND}" stroke-width="6" fill="none" stroke-linecap="round"/>
    `;
  }

  private framed(someContent: string) {
    return new SvgKeyImage(`
      <svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
        <rect width="144" height="144" fill="${BACKGROUND}"/>
        ${someContent}
      </svg>
    `.trim());
  }
}
