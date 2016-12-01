import PositionIterable from "./positionIterable";

export interface FindCallback<T> {
  key: string;
  value?: (value: any, index: number, thisArg?: T) => boolean;
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
  private _callbackFailure?: (found: any, callback?: FindCallback<T>) => boolean;

  constructor(pos: RoomPosition, maxDistance: number,
              thisArg: undefined|T,
              findCallbacks: FindCallback<T>[],
              callbackFailure?: (found: any, callback?: FindCallback<T>) => boolean ) {
    this._start = pos;
    this._itr = new PositionIterable(pos);
    this._minY = pos.y - maxDistance - 1;
    this._findCallbacks = findCallbacks;
    this._thisArg = thisArg;
    this._callbackFailure = callbackFailure;
  }

  public next(): IteratorResult<boolean> {
    const pos = this._itr.next().value;
    if (pos.y < this._minY) {
      return {done: true} as IteratorResult<boolean>;
    }
    const dist = this._start.getRangeTo(pos);

    let doContinue = true;
    for (const find of this._findCallbacks) {
      const res = pos.lookFor(find.key);
      if (find.value && this._callbackFailure) {
        for (const found of res) {
          const callbackSuccess = find.value(found, dist, this._thisArg);
          doContinue = doContinue && (callbackSuccess || this._callbackFailure(found, find));
        }
      } else if (find.value) {
        for (const found of res) {
          const callbackSuccess = find.value(found, dist, this._thisArg);
          doContinue = doContinue && callbackSuccess;
        }
      } else if (this._callbackFailure) {
        doContinue = doContinue && (res.length !== 0 || this._callbackFailure(undefined));
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
