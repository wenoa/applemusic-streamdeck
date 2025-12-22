import { describe, expect, it } from "vitest";
import { NextTrackAction } from "../../src/actions/next-track";
import { PreviousTrackAction } from "../../src/actions/previous-track";
import type { AppleMusicAction } from "../../src/actions/apple-music-action";
import { AppleMusic } from "../../src/music/apple-music";
import type { KeyImage } from "../../src/images/key-image";
import { ManualTimer } from "../core/manual-timer";
import { FakeMusicBridge } from "../music/fake-music-bridge";
import { FakeKey } from "../stream-deck/fake-key";
import { images } from "./music-actions";

type TrackNavigationExample = {
  name: string;
  actionFor: (music: AppleMusic) => AppleMusicAction;
  image: KeyImage;
  command: string;
};

const trackNavigations: TrackNavigationExample[] = [
  {
    name: "NextTrackAction",
    actionFor: music => NextTrackAction.connectedTo(music, images),
    image: images.nextTrack(),
    command: "skipToNextTrack",
  },
  {
    name: "PreviousTrackAction",
    actionFor: music => PreviousTrackAction.connectedTo(music, images),
    image: images.previousTrack(),
    command: "returnToPreviousTrack",
  },
];

describe.each(trackNavigations)("$name", ({ actionFor, image, command }) => {
  it("shows where it moves when Music is open", async () => {
    const bridge = new FakeMusicBridge();
    const key = FakeKey.withoutSettings();
    await actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer())).onWillAppear(key.appeared());

    await bridge.report({ type: "stopped" });

    expect(key.lastImage()).toBe(image.dataUri());
  });

  it(`asks Music to ${command} when pressed`, async () => {
    const bridge = new FakeMusicBridge();
    const action = actionFor(AppleMusic.connectedThrough(bridge, new ManualTimer()));
    await bridge.report({ type: "playing" });

    await action.onKeyDown(FakeKey.withoutSettings().pressed());

    expect(bridge.lastCommand()).toEqual({ command });
  });
});
