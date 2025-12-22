import type { PropertyInspector } from "../../src/actions/property-inspector";

type SentPayload = Parameters<PropertyInspector["send"]>[0];

export class FakePropertyInspector implements PropertyInspector {
  private sentPayloads: SentPayload[] = [];

  async send(payload: SentPayload) {
    this.sentPayloads = [...this.sentPayloads, payload];
  }

  lastPayload() {
    return this.sentPayloads.at(-1) ?? {};
  }
}
