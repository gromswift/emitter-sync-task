/*

  Just a simple even emitter with subscribe and unsubscribe methods

*/

export class EventEmitter<T extends string> {
  events: Map<T, VoidFunction[]>;

  constructor() {
    this.events = new Map();
  }

  subscribe(eventName: T, callback: VoidFunction) {
    const eventSubscribers = this.events.get(eventName);
    this.events.set(eventName, [...(eventSubscribers || []), callback]);
  }

  unsubscribe(eventName: T, callback: VoidFunction) {
    const eventSubscribers = this.events.get(eventName);
    if (!eventSubscribers) return;

    this.events.set(
      eventName,
      eventSubscribers.filter((s) => s !== callback)
    );
  }

  emit(eventName: T) {
    const eventSubscribers = this.events.get(eventName);
    if (!eventSubscribers) return;

    for (const callback of eventSubscribers) {
      callback();
    }
  }
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */
