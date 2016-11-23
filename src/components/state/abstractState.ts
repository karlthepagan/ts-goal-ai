import * as Keys from "../keys";
import * as Filters from "../filters";

/**
 * Flyweight objects which wrap memory and object to calculate state
 */
abstract class State<T> {
  protected _key: string;
  protected _subject: T|null;
  protected _memory: any;

  public wrap(key: string, subject: T|null, memory: any): State<T> {
    this._key = key;
    this._subject = subject;
    this._memory = memory;

    this.init();

    return this;
  }

  public subject(): T {
    return this._subject as T;
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

    // console.log("at", this, ":", JSON.stringify(this._memory));

    if (this._memory[Keys.SEEN] === undefined) {
      this._memory[Keys.SEEN] = 1;
      if (!this.isVirtual()) {
        this._memory[Keys.LOCATION_POS] = Filters.posAsStr((this.subject() as any).pos);
        this._memory[Keys.LOCATION_ROOM] = Filters.room(this.subject());
      }

      return true;
    }

    return false;
  }

  public toString() {
    (this._subject as any).derps();
  }

  public isVirtual(): boolean {
    return this._subject === null;
  }

  public resolve(): boolean {
    const obj = this.lookUp(this._key);
    if (obj === null) {
      return false;
    }
    this._subject = obj;
    this._memory = obj.getMemory(); // TODO abstract?
    return true;
  }

  public lookUp(id: string): any {
    return Game.getObjectById(id);
  }
}
export default State;
