export interface ExposeStats<T extends string> {
  getStats(eventName: T): number;
}

export class EventStatistics<T extends string> implements ExposeStats<T> {
  private eventStats: Map<T, number> = new Map();

  getStats(eventName: T): number {
    return this.eventStats.get(eventName) || 0;
  }

  setStats(eventName: T, value: number) {
    this.eventStats.set(eventName, value);
  }
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */
