export interface Captions {
  closedMusic(): string;

  unauthorizedMusic(): string;

  missingPlaylist(): string;
}

export class SpanishCaptions implements Captions {
  closedMusic() {
    return "Cerrado";
  }

  unauthorizedMusic() {
    return "Sin permiso";
  }

  missingPlaylist() {
    return "Sin playlist";
  }
}

export class EnglishCaptions implements Captions {
  closedMusic() {
    return "Closed";
  }

  unauthorizedMusic() {
    return "No access";
  }

  missingPlaylist() {
    return "No playlist";
  }
}
