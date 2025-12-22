import streamDeck from "@elgato/streamdeck";

type PropertyInspectorPayload = Parameters<typeof streamDeck.ui.sendToPropertyInspector>[0];

export interface PropertyInspector {
  send(aPayload: PropertyInspectorPayload): Promise<void>;
}

export class StreamDeckPropertyInspector implements PropertyInspector {
  async send(aPayload: PropertyInspectorPayload) {
    await streamDeck.ui.sendToPropertyInspector(aPayload);
  }
}
