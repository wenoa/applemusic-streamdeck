export class Listeners {
  private listeners: (() => Promise<void>)[] = [];

  add(aListener: () => Promise<void>) {
    this.listeners = [...this.listeners, aListener];
  }

  async notify() {
    await Promise.all(this.listeners.map(listener => listener()));
  }
}
