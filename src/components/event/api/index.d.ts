import Named from "../../named";
import CreepState from "../../state/creepState";
import Joinpoint from "./joinpoint";
import State from "../../state/abstractState";
import EnemyCreepState from "../../state/enemyCreepState";
import RoomState from "../../state/roomState";

type OnMove<R> = (jp: Joinpoint<CreepState, void>, fromPos: RoomPosition, forwardDir: number, ...args: any[]) => R;

/**
 * spawn, death, decay, rested
 * TODO lifecycle is a good example of difference between call and apply. Maybe apply needs an extra argument which
 * describes the subject of the event? Maybe call can go to any object not just the subject of the event?
 */
type OnLifecycle<DST extends CreepState|OwnedStructure, R> = (jp: Joinpoint<DST, string>, ...args: any[]) => R;
type OnEnergy<DST extends CreepState|OwnedStructure, R> = (jp: Joinpoint<DST, string>, ...args: any[]) => R;
type OnScheduled = (jp: Joinpoint<any, void>, ...args: any[]) => void;
export type OnIntercept<DST, R> = (jp: Joinpoint<DST, R>, ...args: any[]) => void;
type OnInfo<DST> = (jp: Joinpoint<DST, any>, ...args: any[]) => void;

export interface WhenEvent<INST, CALLBACK> {
  of<T extends INST>(instance: T): Action<CALLBACK, T, EventSelector>;
  ofAny<T extends INST>(type: () => T): Action<CALLBACK, T, EventSelector>;
  ofAll(): Action<CALLBACK, INST, EventSelector>;
  occursAt(relativeTime: number, instance: INST): Action<CALLBACK, INST, EventSelector>;
}

// watch for an event, then respond
export interface EventSelector {
  // TODO instances bound by selectors are for the destination, instances bound elsewhere are ???
  /**
   * creep to be spawned
   *
   * shortcut for intercept(SpawnState).
   * src spawn
   * dst creep
   */
  spawn(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
  /**
   * creep will die
   * src spawn - closest spawn?
   * dst creep
   */
  death(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
  /**
   * fatigue was high but is now zero
   * src terrain?
   * dst creep
   */
  rested(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
  /**
   * structure will decay one step
   * src structure
   * dst structure
   */
  decay<T extends OwnedStructure>(): WhenEvent<T, OnLifecycle<T, void>>;
  /**
   * energy will be full
   * src creep|struct other! (who is filling me)
   * dst creep|struct
   */
  full<T extends CreepState|OwnedStructure>(): WhenEvent<T, OnEnergy<T, void>>; // TODO structure state
  /**
   * energy will be empty
   * src creep|struct (who am I working?) - source of the drain
   * dst creep|struct
   */
  empty<T extends CreepState|OwnedStructure>(): WhenEvent<T, OnEnergy<T, void>>;
  /**
   * creep moved in last tick
   * TODO ambiguous with the command? before -> after
   * src creep
   * dst creep
   */
  move(): WhenEvent<CreepState, OnMove<void>>;
  /**
   * enemy spotted!
   * src EnemyCreepState
   * dst RoomState
   */
  aggro(): WhenEvent<EnemyCreepState, OnInfo<RoomState>>;
  /**
   * ouch!
   * src EnemyCreepState
   * dst creep|struct
   */
  attacked(): WhenEvent<EnemyCreepState, OnInfo<CreepState|OwnedStructure>>;
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
export interface Action<CALLBACK, TYPE, SELECT> { // TODO TYPE for origin of the event? (that's in the EventRegistry)
  // TODO void if no "and impl"
  // TODO callback will be method reference like intercept(Class).after(c=>c.methodName)
  callAnd       (instance: TYPE, callback: CALLBACK, ...args: any[]): Action<CALLBACK, TYPE, SELECT>;
  call          (): TYPE; // direct call, captured by proxy
  apply         (func: Function): void; // direct function invoke, TODO index of anonymous functions!!!
  fireEvent     (eventName: string): Action<CALLBACK, TYPE, SELECT>; // TODO is this voodoomagic?
  wait          (relativeTime: number): Action<CALLBACK, TYPE, SELECT>;
  // TODO filter on source or destination
  filterOn      (thisArg: Named, callback: CALLBACK, ...args: any[]): SELECT; // illegal for When.after or EventSelector
  or            (): SELECT; // TODO difficult
  // TODO don't implement and, just save the builder object and invoke multiple times?
  // andThen       (): SELECT; // illegal for When.before
  // TODO tap?
  // andIntercept  <INST extends State<any>>(instance: State<any>): When<ApiCalls<INST>>; // NEW SUBJECT, JOIN
  andWhen       (): EventSelector;
  D             (): SELECT; // close paren TODO difficult
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
  C(): When<TYPE>; // open paren TODO difficult
}

export interface WhenClosure<INST, API> {
  // TODO move intercept to INST?
  before(method: (i: API) => Function): Action<OnIntercept<API, void>, INST, WhenClosure<INST, API>>;
  after(method: (i: API) => Function): Action<OnIntercept<API, any>, INST, WhenClosure<INST, API>>;
  failure(method: (i: API) => Function): Action<OnIntercept<API, void>, INST, WhenClosure<INST, API>>;
  C(): WhenClosure<INST, API>; // open paren TODO difficult
}

// https://github.com/Microsoft/TypeScript/issues/4890#issuecomment-141879451

export interface EventRegistry { // TODO instances declared in this context are the source of event bindings
  when            (): EventSelector;
  // TODO schedule target jp? pass thru what caused the thing
  schedule        <INST extends Named>(relativeTime: number, instance: INST): Action<OnScheduled, INST, void>;
  // schedule      <INST extends Named>(relativeTime: number, instance: INST): Schedule<INST>;
  // interceptOne  <INST extends State<any>>(instance: INST): When<ApiCalls<INST>>;
  intercept       <API, INST extends State<API>>(implType: Constructor<INST & State<API>>): WhenClosure<INST, API>; // TODO INST type
  // next          <INST extends State<any>>(instance: INST): When<ApiCalls<INST>>;
  // run           <INST extends Named>(instance: INST): Action<Function, void, void>;
  // dispatch        (instance: Named): TriggeredEvents;
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
