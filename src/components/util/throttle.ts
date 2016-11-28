import {botMemory} from "../../config/config";
import * as F from "../functions";
import {log} from "../support/log";

export class Throttle {
  private _cpuOut: number;
  private _cpuWarn: number;
  private _rescoreTicks: number;
  private _roomscanTicks: number;
  private _virtualRoomscanTicks: number;

  constructor(mem: any) {
    this._cpuOut = F.elvis(mem.cpuOut, 150);
    this._cpuWarn = F.elvis(mem.cpuWarn, 3000);
    this._rescoreTicks = F.elvis(mem.rescoreTicks, 10);
    this._virtualRoomscanTicks = F.elvis(mem.virtualRoomscanTicks, 10);
    this._roomscanTicks = F.elvis(mem.roomscanTicks, 5);
  }

  public isCpuOk() {
    const bucket = Game.cpu.bucket;
    if (bucket < this._cpuOut) {
      log.error("CPU bucket exhausted:", bucket);
      return false;
    } else if (bucket < this._cpuWarn) {
      log.warning("CPU bucket low", bucket);
    }
    return false;
  }

  public isRescoreTime() {
    return Game.time % this._rescoreTicks === 0;
  }

  public isRoomscanTime() {
    return Game.time % this._roomscanTicks === 0;
  }

  public isVirtualRoomscanTime() {
    return Game.time % this._virtualRoomscanTicks === 0;
  }
}

let throttleCache: Throttle;
export const throttle = () => {
  return throttleCache = F.elvis(throttleCache, new Throttle(F.expand([ "config" ], botMemory())));
};
