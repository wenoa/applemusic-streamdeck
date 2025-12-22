export interface KeyImage {
  dataUri(): string;
}

export class SvgKeyImage implements KeyImage {
  constructor(private readonly svg: string) {
  }

  dataUri() {
    return `data:image/svg+xml,${encodeURIComponent(this.svg)}`;
  }
}

export class EncodedKeyImage implements KeyImage {
  constructor(private readonly encodedImage: string) {
  }

  dataUri() {
    return this.encodedImage;
  }
}
