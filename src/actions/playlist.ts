import type { SendToPluginEvent } from "@elgato/streamdeck";
import { action } from "@elgato/streamdeck";
import { Listeners } from "../core/listeners";
import type { Display } from "../display/display";
import type { KeyImages } from "../images/key-images";
import type { AppleMusic } from "../music/apple-music";
import type { PlaylistSettings } from "../music/playlists/playlist";
import { Playlist } from "../music/playlists/playlist";
import { AppleMusicAction } from "./apple-music-action";
import type { PropertyInspector } from "./property-inspector";

@action({ UUID: "studio.wenoa.applemusic.playlist" })
export class PlaylistAction extends AppleMusicAction<PlaylistSettings> {
  private readonly coverArrivals = new Listeners();

  constructor(
    anAppleMusic: AppleMusic,
    someImages: KeyImages,
    private readonly propertyInspector: PropertyInspector,
  ) {
    super(anAppleMusic, someImages);
  }

  static connectedTo(anAppleMusic: AppleMusic, someImages: KeyImages, aPropertyInspector: PropertyInspector) {
    return new this(anAppleMusic, someImages, aPropertyInspector)
      .followingSituation()
      .followingCoverArrivals();
  }

  private followingCoverArrivals() {
    this.coverArrivals.add(async () => this.renderVisibleKeys());

    return this;
  }

  // The property inspector's playlist picker asks for its options through this message.
  override async onSendToPlugin({ payload }: SendToPluginEvent<{ event?: string }, PlaylistSettings>) {
    const playlists = await this.music.listPlaylists();

    await this.propertyInspector.send({
      event: payload.event ?? "",
      items: playlists.map(playlist => playlist.asSelectableItem()),
    });
  }

  protected keyFor(someSettings: PlaylistSettings, aDisplay: Display) {
    return Playlist
      .fromSettings(someSettings)
      .keyOn(aDisplay, this.images, this.coverArrivals);
  }
}
