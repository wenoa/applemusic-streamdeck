export interface Timeout {
  start(aCallback: () => void, aDuration: number): Timeout;

  stop(): Timeout;

  isActive(): boolean;
}

export class InactiveTimeout implements Timeout {
  start(aCallback: () => void, aDuration: number): Timeout {
    return ActiveTimeout.started(aCallback, aDuration);
  }

  stop(): Timeout {
    return this;
  }

  isActive(): boolean {
    return false;
  }
}

export class ActiveTimeout implements Timeout {
  constructor(private readonly timeout: NodeJS.Timeout) {
  }

  static started(aCallback: () => void, aDuration: number) {
    return new this(setTimeout(aCallback, aDuration));
  }

  start(aCallback: () => void, aDuration: number): Timeout {
    return this.stop().start(aCallback, aDuration);
  }

  stop(): Timeout {
    clearTimeout(this.timeout);

    return new InactiveTimeout();
  }

  isActive(): boolean {
    return true;
  }
}
