/* Check the comments first */

import { EventEmitter } from "./emitter";
import { EventDelayedRepository, EventRepositoryError } from "./event-repository";
import { EventStatistics } from "./event-statistics";
import { ResultsTester } from "./results-tester";
import { triggerRandomly } from "./utils";

const MAX_EVENTS = 1000;

enum EventName {
  EventA = "A",
  EventB = "B",
}

const EVENT_NAMES = [EventName.EventA, EventName.EventB];

/*

  An initial configuration for this case

*/

function init() {
  const emitter = new EventEmitter<EventName>();

  triggerRandomly(() => emitter.emit(EventName.EventA), MAX_EVENTS);
  triggerRandomly(() => emitter.emit(EventName.EventB), MAX_EVENTS);

  const repository = new EventRepository();
  const handler = new EventHandler(emitter, repository);

  const resultsTester = new ResultsTester({
    eventNames: EVENT_NAMES,
    emitter,
    handler,
    repository,
  });
  resultsTester.showStats(20);
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */

/*

  The implementation of EventHandler and EventRepository is up to you.
  Main idea is to subscribe to EventEmitter, save it in local stats
  along with syncing with EventRepository.

*/

class EventHandler extends EventStatistics<EventName> {
  private SYNC_INTERVAL_MS = 300;
  private errorCount: Map<EventName, number> = new Map();
  private inSync: Map<EventName, boolean> = new Map();
  repository: EventRepository;
  
  constructor(emitter: EventEmitter<EventName>, repository: EventRepository) {
    super();
    this.repository = repository;
    
    emitter.subscribe(EventName.EventA, () => this.handleEvent(EventName.EventA));
    emitter.subscribe(EventName.EventB, () => this.handleEvent(EventName.EventB));
    
    setInterval(() => this.syncAllEventsWithRepository(), this.SYNC_INTERVAL_MS);
  }
  
  private handleEvent(eventName: EventName) {
    this.setStats(eventName, this.getStats(eventName) + 1);
    // console.log(`Event ${eventName} handled. Local count: ${this.getStats(eventName)}`);
    
    this.syncSingleEvent(eventName);
  }
  
  private async syncAllEventsWithRepository() {
    for (const eventName of Object.values(EventName)) {
      await this.syncSingleEvent(eventName);
    }
  }
  
  private async syncSingleEvent(eventName: EventName) {
    if (this.inSync.get(eventName)) {
      // console.log(`Event ${eventName} is already synchronizing, skipping.`);
      return;
    }
    
    const localCount = this.getStats(eventName);
    const remoteCount = this.repository.getStats(eventName);
    
    if (remoteCount > localCount) {
      // console.error(`Error: Remote count (${remoteCount}) exceeds local count (${localCount}) for event ${eventName}.`);
      return;
    }
    
    const difference = localCount - remoteCount;
    
    if (difference > 0) {
      this.inSync.set(eventName, true);
      // console.log(`Synchronizing event ${eventName}. Difference: ${difference}`);
      
      try {
        await this.repository.saveEventData(eventName, difference);
        // console.log(`Successfully synchronized ${difference} events for ${eventName}.`);
        this.errorCount.set(eventName, 0);
      } catch (e) {
         if (e === EventRepositoryError.TOO_MANY) {
          // console.warn(`TOO_MANY error while synchronizing event ${eventName}. Will retry later.`);
          this.errorCount.set(eventName, (this.errorCount.get(eventName) || 0) + 1);
        }
      } finally {
        this.inSync.set(eventName, false);
      }
    }
  }
}

class EventRepository extends EventDelayedRepository<EventName> {
  async saveEventData(eventName: EventName, count: number) {
    try {
      await this.updateEventStatsBy(eventName, count);
      // console.log(`Saved ${count} events for ${eventName} to the repository.`);
    } catch (e) {
      if (e === EventRepositoryError.TOO_MANY) {
        // console.warn(`TOO_MANY requests - waiting and retrying for event ${eventName}.`);
        throw e;
      } else if (e === EventRepositoryError.RESPONSE_FAIL) {
        // console.warn(`RESPONSE_FAIL - event ${eventName} may have already been saved.`);
        throw e;
      } else if (e === EventRepositoryError.REQUEST_FAIL) {
        // console.warn(`REQUEST_FAIL - waiting and retrying for event ${eventName}.`);
        throw e;
      } else {
        // console.error(`Error saving event ${eventName}: ${e}`);
        throw e;
      }
    }
  }
}

init();
