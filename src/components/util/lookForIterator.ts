import PositionIterable from "./positionIterable";

export interface FindCallback<T> {
  key: string;
  /**
   * return false to invoke the chained handler
   */
  value?: (value: any, index: number, thisArg?: T) => boolean; // TODO thisArg or position?
  target?: string;
}

export default class LookForIterator<T> implements Iterable<boolean>, Iterator<boolean> {
  public static search<T>(pos: RoomPosition, maxDistance: number,
                          thisArg: undefined|T,
                          findCallbacks: FindCallback<T>[], // TODO everything past distance is optional
                          callbackFailure?: (found: any, callback?: FindCallback<T>) => boolean ) {
    if (_.values(findCallbacks).length === 0) {
      return;
    }
    const itr = new LookForIterator<T>(pos, maxDistance, thisArg, findCallbacks, callbackFailure);
    let working = true;
    while (working) {
      working = !itr.next().done;
    }
  }

  private _start: RoomPosition;
  private _itr: PositionIterable;
  private _minY: number;
  private _findCallbacks: FindCallback<T>[];
  private _thisArg: undefined|T;
  private _callbackFailure?: (found: any, callback?: FindCallback<T>, thisArg?: T) => boolean;

  constructor(pos: RoomPosition, maxDistance: number,
              thisArg: undefined|T,
              findCallbacks: FindCallback<T>[],
              callbackFailure?: (found: any, callback?: FindCallback<T>) => boolean ) {
    this._start = pos;
    this._itr = new PositionIterable(pos, 1, maxDistance);
    this._minY = pos.y - maxDistance;
    this._findCallbacks = findCallbacks;
    this._thisArg = thisArg;
    this._callbackFailure = callbackFailure;
  }

  /*
   [9:11:09 PM] Error: look coords are out of bounds
   at _lookSpatialRegister (/opt/engine/dist/game/rooms.js:627:19)
   at . (/opt/engine/dist/game/rooms.js:737:16)
   at .lookForAt (evalmachine.:1:72)
   at . (/opt/engine/dist/game/rooms.js:1347:21)
   at .lookFor (evalmachine.:1:72)
   at LookForIterator.next (main:5347:30)
   */
  public next(): IteratorResult<boolean> {
    let pos: RoomPosition;
    do {
      pos = this._itr.next().value;
      if (pos.y < this._minY) {
        return {done: true} as IteratorResult<boolean>;
      }
    }
    while (pos.x < 0 || pos.x > 49 || pos.y < 0 || pos.y > 49);

    const dist = this._start.getRangeTo(pos);

    let doContinue = true;
    for (const find of this._findCallbacks) {
      const res = pos.lookFor(find.key);
      if (find.value && this._callbackFailure) {
        for (const found of res) {
          const callbackSuccess = find.value(found, dist, this._thisArg);
          doContinue = doContinue && (callbackSuccess || this._callbackFailure(found, find, this._thisArg));
        }
      } else if (find.value) {
        for (const found of res) {
          const callbackSuccess = find.value(found, dist, this._thisArg);
          doContinue = doContinue && callbackSuccess;
        }
      } else if (this._callbackFailure) {
        doContinue = doContinue && (res.length !== 0 || this._callbackFailure(undefined, undefined, this._thisArg));
      } else {
        doContinue = doContinue && res.length !== 0;
      }
    }

    return {
      done: !doContinue,
      value: doContinue,
    };
  }

  public [Symbol.iterator](): Iterator<boolean> {
    return this;
  }
}
