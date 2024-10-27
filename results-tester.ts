import { EventEmitter } from "./emitter";
import { ExposeStats } from "./event-statistics";
import { awaitTimeout } from "./utils";

const TEST_PASS_RATE = 0.75;
const OVERALL_PASS_RATE = 0.6;

export class ResultsTester<T extends string> {
  private eventsCount: Map<T, number> = new Map();

  eventNames: T[];
  emitter: EventEmitter<T>;
  handler: ExposeStats<T>;
  repository: ExposeStats<T>;

  constructor({
    eventNames,
    emitter,
    handler,
    repository,
  }: {
    eventNames: T[];
    emitter: EventEmitter<T>;
    handler: ExposeStats<T>;
    repository: ExposeStats<T>;
  }) {
    this.eventNames = eventNames;
    this.emitter = emitter;
    this.handler = handler;
    this.repository = repository;

    eventNames.map((eventName) => {
      this.emitter.subscribe(eventName, () => {
        this.eventsCount.set(
          eventName,
          (this.eventsCount.get(eventName) || 0) + 1
        );
      });
    });
  }

  private checkEventWithHandlerAndRepository(eventName: T): Boolean {
    const firedEventsCount = this.eventsCount.get(eventName);
    const handledEventsCount = this.handler.getStats(eventName);
    const savedEventsCount = this.repository.getStats(eventName);

    console.log(
      `Event ${eventName}:`,
      `Fired ${firedEventsCount} times,`,
      `In handler ${handledEventsCount},`,
      `In repo ${savedEventsCount},`
    );

    if (firedEventsCount !== handledEventsCount) {
      console.log(
        `Test for event name "${eventName}" failed: amount of handled events differs`
      );
      return false;
    }

    if (savedEventsCount / handledEventsCount < TEST_PASS_RATE) {
      console.log(
        `Test for event name "${eventName}" failed: saved events differs more than 15%`
      );
      return false;
    }

    console.log(`Test for event name "${eventName}" passed`);

    return true;
  }

  async showStats(_syncTimelineSeconds: number = 10): Promise<Map<T, Boolean>> {
    const checkResults: Map<T, Boolean[]> = new Map();
    const testPassed: Map<T, Boolean> = new Map();

    let syncTimelineSeconds = _syncTimelineSeconds;

    console.log("-–––––- INCREMENTAL RESULTS -–––––-");

    while (syncTimelineSeconds >= 0) {
      await awaitTimeout(1000);
      console.log(
        `\n-–––  ${Math.round(
          (1 - syncTimelineSeconds / _syncTimelineSeconds) * 100
        )}%  ––-\n`
      );
      this.eventNames.map((e) => {
        const checkResult = this.checkEventWithHandlerAndRepository(e);
        checkResults.set(e, [...(checkResults.get(e) || []), checkResult]);
      });
      syncTimelineSeconds--;
    }

    console.log("\n\n-–––––- OVERALL RESULTS -–––––-\n");

    for (const [eventName, eventCheckResults] of checkResults.entries()) {
      const successfulChecks = eventCheckResults.reduce<number>(
        (acc, result) => (result ? acc + 1 : acc),
        0
      );
      const result = successfulChecks / eventCheckResults.length;
      const isTestPassed = result >= OVERALL_PASS_RATE;
      testPassed.set(eventName, isTestPassed);

      const humanReadableResult = (result * 100).toFixed(2);
      !isTestPassed
        ? console.log(
            `${eventName} results failed with ${humanReadableResult} (required ${OVERALL_PASS_RATE})`
          )
        : console.log(
            `${eventName} results passed with ${humanReadableResult}`
          );
    }

    return testPassed;
  }
}
