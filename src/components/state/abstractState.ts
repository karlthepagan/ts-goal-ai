import * as Keys from "../keys";
import * as Filters from "../filters";

/**
 * Flyweight objects which wrap memory and object to calculate state
 */
abstract class State<T> {
  protected _subject: T;
  protected _memory: any;

  public wrap(subject: T, memory: any): State<T> {
    this._subject = subject;
    this._memory = memory;

    this.init();

    return this;
  }

  public subject(): T {
    return this._subject;
  }

  public memory(): any {
    return this._memory;
  }

  public isPaused(): boolean {
    return this._memory === undefined;
  }

  public init(): boolean {
    if (this._memory === undefined) {
      return false;
    }

    // console.log("at", this.subject(), ":", JSON.stringify(this._memory));

    if (this._memory[Keys.SEEN] === undefined) {
      this._memory[Keys.SEEN] = 1;
      this._memory[Keys.LOCATION_POS] = Filters.posAsStr((this.subject() as any).pos);
      this._memory[Keys.LOCATION_ROOM] = Filters.room(this.subject());

      return true;
    }

    return false;
  }

  public toString() {
    (this._subject as any).derps();
  }
}
export default State;
