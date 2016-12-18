import {botMemory} from "../../config/config";
import {log} from "../support/log";

export function on(label: string, clear?: boolean) {
  if (botMemory()[label]) {
    debugger; // Debug.on
    if (clear) {
      delete botMemory()[label];
    }
  }
}

export function throwing<T>(throwing: T): T {
  debugger; // Debug.throwing
  return throwing;
}

export function always() {
  debugger; // Debug.always
}

export function temporary() {
  debugger; // Debug.temporary
}

export function error(...args: any[]) {
  debugger; // Debug.error
  log.error(args);
}
