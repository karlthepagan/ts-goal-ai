declare function require(path: string): any;

interface Global {
  log: any;
}

declare var global: Global;

// interface Object {
//   __proto__: any;
// }
// if (actor.__proto__ === Source.prototype) {

interface RoomObject {
  getMemory(): any;
}

interface Room {
  getMemory(): any;
}

interface Memory {
  goals: any;
  objects: any;
  uuid: number;
  log: any;
  delete: boolean;
  reset: boolean;
  pause: boolean;
  init(): void;
}
