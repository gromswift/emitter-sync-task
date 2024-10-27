/* 
  class EventDelayedRepository

  Simulates basic repository behavior, capable of asynchronously
  saving data. It can also return errors or both save and return
  errors, mimicking real-world scenarios.

  It also resolves with error for "too many requests"

*/

import { ExposeStats } from "event-statistics";
import { awaitTimeout, randomTo } from "./utils";

export const EVENT_SAVE_DELAY_MS = 3 * 100;

export enum EventRepositoryError {
  TOO_MANY = "Too many requests",
  RESPONSE_FAIL = "Response delivery fail",
  REQUEST_FAIL = "Request fail",
}

export class EventDelayedRepository<T extends string>
  implements ExposeStats<T>
{
  private eventStats: Map<T, number> = new Map();
  private lastRequestDate: Date = new Date();

  getStats(eventName: T): number {
    return this.eventStats.get(eventName) || 0;
  }

  private setStats(eventName: T, value: number) {
    this.eventStats.set(eventName, value);
  }

  async updateEventStatsBy(eventName: T, by: number) {
    const now = new Date();

    if (now.getTime() < this.lastRequestDate.getTime() + EVENT_SAVE_DELAY_MS) {
      throw EventRepositoryError.TOO_MANY;
    }

    this.lastRequestDate = now;
    await awaitTimeout(randomTo(1000));

    const chance = randomTo(1500);
    if (chance < 300) throw EventRepositoryError.REQUEST_FAIL;
    this.setStats(eventName, this.getStats(eventName) + by);

    if (chance > 1000) throw EventRepositoryError.RESPONSE_FAIL;
  }
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */
