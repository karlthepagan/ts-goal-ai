// why isn't Constructor in lib.es6.d.ts?
interface Constructor<T> {
  new (...args: any[]): T;
  name: string;
}

interface OwnedEnergy {
  energy: number;
  energyCapacity: number;
}

interface Memory {
  uuid: number;
  log: any;
  k: any;
}

declare function require(path: string): any;

interface Global {
  ai: any;
  $: any;
  log: any;
}

declare var global: Global;
