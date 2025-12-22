import streamDeck from "@elgato/streamdeck";
import { describe, expect, it, vi } from "vitest";
import { StreamDeckPropertyInspector } from "../../src/actions/property-inspector";

// Stream Deck's UI controller only works connected to the Stream Deck application, so it is stubbed here.
vi.mock("@elgato/streamdeck", () => ({
  default: {
    ui: {
      sendToPropertyInspector: vi.fn(async () => undefined),
    },
  },
}));

describe("StreamDeckPropertyInspector", () => {
  it("sends payloads to the visible property inspector", async () => {
    await new StreamDeckPropertyInspector().send({ event: "getPlaylists" });

    expect(streamDeck.ui.sendToPropertyInspector).toHaveBeenCalledWith({ event: "getPlaylists" });
  });
});
