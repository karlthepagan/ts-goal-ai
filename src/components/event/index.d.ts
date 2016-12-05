import Named from "../named";
import CreepState from "../state/creepState";

type ScheduledFunction = (args: any[]) => void;

type OnMove<R> = (jp: Joinpoint<void>, fromPos: RoomPosition, forwardDir: number, ...args: any[]) => R;
type OnLifecycle<R> = (jp: Joinpoint<string>, ...args: any[]) => R; // spawn, death, decay, rested
type OnEnergy<R> = (jp: Joinpoint<string>, ...args: any[]) => R;

export interface WhenEvent<INST, CALLBACK> {
  of<T extends INST>(instance: T): Action<CALLBACK, T, Schedule>;
  ofAny<T extends INST>(type: () => T): Action<CALLBACK, T, Schedule>;
  ofAll(): Action<CALLBACK, INST, Schedule>;
  occursAt(relativeTime: number, instance: INST): Action<CALLBACK, INST, Schedule>;
}

// schedule for a
export interface Schedule {
  /**
   * creep to be spawned
   */
  spawn(): WhenEvent<Creep, OnLifecycle<void>>;
  /**
   * creep will die
   */
  death(): WhenEvent<Creep, OnLifecycle<void>>;
  /**
   * fatigue was high but is now zero
   */
  rested(): WhenEvent<CreepState, OnLifecycle<void>>;
  /**
   * structure will decay one step
   */
  decay<T extends OwnedStructure>(): WhenEvent<T, OnLifecycle<void>>;
  /**
   * energy will be full
   */
  full<T extends CreepState|OwnedStructure>(): WhenEvent<T, OnEnergy<void>>; // TODO structure state
  /**
   * energy will be empty
   */
  empty<T extends CreepState|OwnedStructure>(): WhenEvent<T, OnEnergy<void>>;
  /**
   * creep moved in last tick
   * TODO ambiguous with the command? before -> after
   */
  move(): WhenEvent<CreepState, OnMove<void>>;
}

interface ProgressInfo {
  /**
   * magnitude - size of the effect
   */
  m: number;
  /**
   * velocity - total magnitude applied this turn
   */
  v: number;
  /**
   * progress - percent completed in this chain
   */
  p: number;
  /**
   * ttl - time to resolution accounting for all effects this turn
   */
  t: number;
}

type ApiFilter<I> = (instance: I, progress: ProgressInfo) => boolean;

type ActionChain<CALLBACK, TYPE> = Action<CALLBACK, TYPE, TYPE>;
type ActionToWhen<CALLBACK, TYPE> = Action<CALLBACK, TYPE, When<TYPE>>;
/**
 * explicit api calls, schedule observations and intercept
 */
export interface ApiCalls<INST> {
  build     (filter?: ApiFilter<INST>): ActionToWhen<OnMove<number>, ApiCalls<INST>>;
  move      (filter?: ApiFilter<INST>): ActionToWhen<OnMove<number>, ApiCalls<INST>>;
  harvest   (filter?: ApiFilter<INST>): ActionToWhen<OnMove<number>, ApiCalls<INST>>;
  transfer  (filter?: ApiFilter<INST>): ActionToWhen<OnMove<number>, ApiCalls<INST>>;
  ranged    (filter?: ApiFilter<INST>): ActionToWhen<OnMove<number>, ApiCalls<INST>>;
  heal      (filter?: ApiFilter<INST>): ActionToWhen<OnMove<number>, ApiCalls<INST>>;
  attack    (filter?: ApiFilter<INST>): ActionToWhen<OnMove<number>, ApiCalls<INST>>;
}

/**
 * @param TYPE? - target for watch, schedule or intercept or triggers
 * @param SELECT - required filters, start of the chain
 */
export interface Action<CALLBACK, TYPE, SELECT> {
  callAnd       (instance: TYPE, callback: CALLBACK, ...args: any[]): Action<CALLBACK, TYPE, SELECT>;
  call          (): TYPE; // direct call, captured by proxy
  apply         (func: Function): void; // direct function invoke
  wait          (relativeTime: number): Action<CALLBACK, TYPE, SELECT>;
  filterOn      (thisArg: Named, callback: CALLBACK, ...args: any[]): SELECT; // illegal for When.after or Schedule
  or            (): SELECT;
  andThen       (): SELECT; // illegal for When.before
  // TODO tap
  // andIntercept  <INST extends State<any>>(instance: State<any>): When<ApiCalls<INST>>; // NEW SUBJECT, JOIN
  andSchedule   (): Schedule;
  D             (): SELECT; // close paren
}

/**
 * instance select -> (Select ->) API -> Action
 *
 * Action -> Action
 *        -> Select
 */
export interface When<TYPE> {
  before: TYPE;
  after: TYPE;
  failure: TYPE;
  C(): When<TYPE>; // open paren
}

/**
 *
 */
export interface TriggeredEvents extends Registry {
  onCompleted(site: ConstructionSite): TriggeredEvents; // TODO build -> done -> built?
  onDeath(pos: RoomPosition): TriggeredEvents;
}

export interface CallbackRegistry {
  on(event: string, callback: Function, ...args: any[]): CallbackRegistry;
}

export interface Registry {
  on(event: string, ...args: any[]): Registry;
}

export interface EventRegistry {
  when(): Schedule;
  // schedule      <INST extends Named>(relativeTime: number, instance: INST): Schedule<INST>;
  // interceptOne  <INST extends State<any>>(instance: INST): When<ApiCalls<INST>>;
  // intercept     <INST extends State<any>>(instance: () => INST): When<ApiCalls<INST>>;
  // next          <INST extends State<any>>(instance: INST): When<ApiCalls<INST>>;
  // run           <INST extends Named>(instance: INST): Action<Function, void, void>;
  // dispatch      (instance: Named): TriggeredEvents;
}
export default EventRegistry;

// export function f(em: EventRegistry) {
//   // em.schedule(1).onSpawn().then().
//   const creep = CreepState.vright("");
//   // em.intercept(CreepState).before.attack().then
//   em.when().death().occursAt(1499, creep);
//   em.when().death().of(creep).call();
// }
//
/*
 * chaining api options
 * - different actors
 * - time delay
 * - or
 * - ?
 */
