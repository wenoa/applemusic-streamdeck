import type { VolumeKey } from "../keys/volume-key";
import type { AppleMusic } from "./apple-music";

const LARGEST_CHANGE = 100;

export abstract class VolumeChange {
  static fromSetting(aSetting: unknown): VolumeChange {
    return PercentageVolumeChange.of(Number(String(aSetting ?? "").trim()));
  }

  abstract renderOn(aKey: VolumeKey): Promise<void>;

  abstract applyFrom(aKey: VolumeKey, anAppleMusic: AppleMusic): Promise<void>;
}

export class PercentageVolumeChange extends VolumeChange {
  private static readonly signed = new Intl.NumberFormat("en", { signDisplay: "always" });

  private constructor(private readonly percentagePoints: number) {
    super();
  }

  static of(somePercentagePoints: number): VolumeChange {
    return this.admits(somePercentagePoints) ? new this(somePercentagePoints) : new InvalidVolumeChange();
  }

  private static admits(somePercentagePoints: number) {
    return Number.isInteger(somePercentagePoints)
      && somePercentagePoints !== 0
      && Math.abs(somePercentagePoints) <= LARGEST_CHANGE;
  }

  async renderOn(aKey: VolumeKey) {
    await aKey.showChange(`${PercentageVolumeChange.signed.format(this.percentagePoints)}%`);
  }

  async applyFrom(_aKey: VolumeKey, anAppleMusic: AppleMusic) {
    anAppleMusic.changeVolumeBy(this.percentagePoints);
  }
}

export class InvalidVolumeChange extends VolumeChange {
  async renderOn(aKey: VolumeKey) {
    await aKey.showInvalidChange();
  }

  async applyFrom(aKey: VolumeKey) {
    await aKey.alert();
  }
}
