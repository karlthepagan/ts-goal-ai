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
  objects: any;
  uuid: number;
  log: any;
  delete: boolean;
  init(): void;
}
