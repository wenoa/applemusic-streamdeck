import type { DidReceiveSettingsEvent, KeyDownEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";

type KeySettings = KeyDownEvent["payload"]["settings"];

export class FakeKey<TSettings extends KeySettings = KeySettings> {
  private shownImages: string[] = [];
  private shownAlerts = 0;

  private constructor(
    readonly id: string,
    private settings: TSettings,
  ) {
  }

  static withoutSettings() {
    return new this("key", {});
  }

  static configuredWith<TSettings extends KeySettings>(someSettings: TSettings) {
    return new this("key", someSettings);
  }

  static identifiedAs<TSettings extends KeySettings>(anId: string, someSettings: TSettings) {
    return new this(anId, someSettings);
  }

  async setImage(image = "") {
    this.shownImages = [...this.shownImages, image];
  }

  async showAlert() {
    this.shownAlerts += 1;
  }

  lastImage() {
    return this.shownImages.at(-1) ?? "";
  }

  imagesShown() {
    return this.shownImages.length;
  }

  alertsShown() {
    return this.shownAlerts;
  }

  appeared() {
    return this.event() as unknown as WillAppearEvent<TSettings>;
  }

  pressed() {
    return this.event() as unknown as KeyDownEvent<TSettings>;
  }

  disappeared() {
    return this.event() as unknown as WillDisappearEvent<TSettings>;
  }

  changedSettingsTo(settings: TSettings) {
    this.settings = settings;

    return this.event() as unknown as DidReceiveSettingsEvent<TSettings>;
  }

  private event() {
    return {
      action: this,
      payload: { settings: this.settings },
    };
  }
}
