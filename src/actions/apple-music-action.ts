import type { DidReceiveSettingsEvent, KeyAction, KeyDownEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { SingletonAction } from "@elgato/streamdeck";
import type { Display } from "../display/display";
import { StreamDeckDisplay } from "../display/stream-deck-display";
import type { KeyImages } from "../images/key-images";
import type { MusicKey } from "../keys/music-key";
import type { AppleMusic } from "../music/apple-music";

type KeySettings = KeyDownEvent["payload"]["settings"];

export abstract class AppleMusicAction<TSettings extends KeySettings = KeySettings> extends SingletonAction<TSettings> {
  private visibleKeys = new Map<string, MusicKey>();

  constructor(
    protected readonly music: AppleMusic,
    protected readonly images: KeyImages,
  ) {
    super();
  }

  protected followingSituation() {
    this.music.whenSituationChanges(async () => this.renderVisibleKeys());

    return this;
  }

  override async onWillAppear({ action, payload }: WillAppearEvent<TSettings>) {
    await this.show(action.id, this.keyOn(action as KeyAction<TSettings>, payload.settings));
  }

  override async onDidReceiveSettings({ action, payload }: DidReceiveSettingsEvent<TSettings>) {
    await this.show(action.id, this.keyOn(action as KeyAction<TSettings>, payload.settings));
  }

  override async onWillDisappear({ action }: WillDisappearEvent<TSettings>) {
    this.visibleKeys.delete(action.id);
  }

  override async onKeyDown({ action, payload }: KeyDownEvent<TSettings>) {
    await this.music.press(this.keyOn(action, payload.settings));
  }

  protected abstract keyFor(someSettings: TSettings, aDisplay: Display): MusicKey;

  private keyOn(anAction: KeyAction<TSettings>, someSettings: TSettings) {
    return this.keyFor(someSettings, new StreamDeckDisplay(anAction));
  }

  private async show(anActionIdentifier: string, aKey: MusicKey) {
    this.visibleKeys.set(anActionIdentifier, aKey);
    await this.music.render(aKey);
  }

  protected async renderVisibleKeys() {
    await Promise.all([...this.visibleKeys.values()].map(key => this.music.render(key)));
  }
}
