import Named from "../../named";
import CreepState from "../../state/creepState";
import Joinpoint from "./joinpoint";
import State from "../../state/abstractState";
import EnemyCreepState from "../../state/enemyCreepState";
import RoomState from "../../state/roomState";
import StructureState from "../../state/structureState";
import SpawnState from "../../state/spawnState";

type OnMove<R> = (jp: Joinpoint<CreepState, void>, fromPos: RoomPosition, forwardDir: number, ...args: any[]) => R;

/**
 * spawn, death, decay, rested
 * lifecycle is a good example of difference between call and apply. use Joinpoint.source to describe the source of the
 * event and Joinpoint.target for the destination.
 */
type OnLifecycle<DST extends CreepState|StructureState<any>|SpawnState, R> = (jp: Joinpoint<DST, string>, ...args: any[]) => R;
type OnEnergy<DST extends CreepState|StructureState<any>, R> = (jp: Joinpoint<DST, string>, ...args: any[]) => R;
type OnScheduled = (jp: Joinpoint<any, void>, ...args: any[]) => void;
export type OnIntercept<DST, R> = (jp: Joinpoint<DST, R>, ...args: any[]) => void;
type OnInfo<DST> = (jp: Joinpoint<DST, any>, ...args: any[]) => void;
export type OnBuildTarget<SRC, DST> = (jp: Joinpoint<SRC, any>, ...args: any[]) => Joinpoint<DST, any>;

export interface WhenEvent<INST, CALLBACK> {
  of<T extends INST>(instance: T): Action<CALLBACK, T, EventSelector>;
  ofAny<T extends INST>(type: () => T): Action<CALLBACK, T, EventSelector>;
  ofAll(): Action<CALLBACK, INST, EventSelector>;
  occursAt(relativeTime: number, instance: INST): Action<CALLBACK, INST, EventSelector>;
}

/**
 * watch for an event, then respond
 *
 * instances bound by selectors are for the destination, instances bound elsewhere are the actors in a joinpoint
 */
export interface EventSelector {
  /**
   * creep to be spawned: fires 1 tick after Spawn.createCreep succeeds
   *
   * src spawn
   * dst creep
   */
  spawn(): WhenEvent<SpawnState, OnLifecycle<SpawnState, void>>;
  /**
   * creep will die: after spawn fires when TTL is set to expire
   *
   * src spawn - birthplace
   * dst creep
   */
  death(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
  /**
   * creep moved in last tick
   *
   * Joinpoints.args represents the parameters of OnMove? ok for now
   * src creep
   * dst creep?
   */
  move(): WhenEvent<CreepState, OnMove<void>>;
  /**
   * enemy spotted!
   *
   * src RoomState
   * dst EnemyCreepState
   */
  aggro(): WhenEvent<EnemyCreepState, OnInfo<RoomState>>;
  /**
   * energy will be full
   *
   * src creep|struct|source other? (who is filling me)
   * dst creep|struct
   */
  full<T extends CreepState|StructureState<any>>(): WhenEvent<T, OnEnergy<T, void>>; // TODO structure state
  /**
   * fatigue was high but is now zero: scheduled after move
   *
   * src terrain moved to (important for *hot* locations/roads (not parking lots))
   * dst creep
   * TODO this is low priority
   */
  rested(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
  /**
   * building has completed
   *
   * src creep
   * dst ownedstructure
   */
  built(): WhenEvent<CreepState, OnLifecycle<CreepState, void>>;
  /**
   * structure will decay one step: scheduled after build progress full
   *
   * src creep?
   * dst structure
   */
  decay<T extends StructureState<any>>(): WhenEvent<T, OnLifecycle<T, void>>;
  /**
   * energy will be empty
   *
   * src creep|struct (who am I working?) - source of the drain
   * dst creep|struct
   */
  empty<T extends CreepState|StructureState<any>>(): WhenEvent<T, OnEnergy<T, void>>;
  /**
   * ouch!
   *
   * src EnemyCreepState
   * dst creep|struct
   */
  attacked(): WhenEvent<EnemyCreepState, OnInfo<CreepState|StructureState<any>>>;
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
 * @param TYPE - target for watch, schedule or intercept or triggers
 * @param SELECT - required filters, start of the chain
 * @param CALLBACK - method reference, gets cached/intercepted
 */
export interface Action<CALLBACK, TYPE, SELECT> { // TODO TYPE for jp.source?
  callAnd       (instance: TYPE, callback: CALLBACK, ...args: any[]): Action<CALLBACK, TYPE, SELECT>;
  call          (): TYPE; // direct call, captured by proxy
  callHandler   (): TYPE; // direct call, will not capture args, emits early?
  apply         (func: Function): void; // direct function invoke, uses an index of anonymous functions!!!
  /**
   * transform one capture into another event: utilizes InterceptorService.triggerBehaviors
   *
   * @param targetBuilder for IMMEDIATE trigger only transform the call parameters
   */
  fireEvent     (eventName: string, targetBuilder?: OnBuildTarget<TYPE, any>): Action<CALLBACK, TYPE, SELECT>;
  /**
   * invoke this action several ticks in the future
   *
   * @param targetBuilder function used to transform the data stored in memory
   */
  wait          (relativeTime: number, targetBuilder?: OnBuildTarget<TYPE, any>): Action<CALLBACK, TYPE, SELECT>;
  // TODO filter on source or destination
  // filterOn      (thisArg: Named, callback: CALLBACK, ...args: any[]): SELECT; // illegal for When.after or EventSelector
  // or            (): SELECT; // TODO difficult,
  // TODO don't implement and, just save the builder object and invoke multiple times?
  // andThen       (): SELECT; // illegal for When.before
  // TODO tap?
  // andIntercept  <INST extends State<any>>(instance: State<any>): When<ApiCalls<INST>>; // NEW SUBJECT, JOIN
  // andWhen       (): EventSelector;
  // D             (): SELECT; // close paren TODO difficult
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
  // C(): When<TYPE>; // open paren TODO difficult
}

export interface WhenClosure<INST, API> {
  // TODO move intercept to INST?
  before(method: (i: API) => Function): Action<OnIntercept<INST, void>, INST, WhenClosure<INST, API>>;
  after(method: (i: API) => Function): Action<OnIntercept<INST, any>, INST, WhenClosure<INST, API>>;
  failure(method: (i: API) => Function): Action<OnIntercept<INST, void>, INST, WhenClosure<INST, API>>;
  // C(): WhenClosure<INST, API>; // open paren TODO difficult
}

// https://github.com/Microsoft/TypeScript/issues/4890#issuecomment-141879451

export interface EventRegistry { // instances declared in this context are the destination of event bindings
  when            (): EventSelector;
  schedule        <INST extends Named>(relativeTime: number, instance: INST): Action<OnScheduled, INST, void>;
  intercept       <API, INST extends State<API>>(implType: Constructor<INST & State<API>>): WhenClosure<INST, API>;
  // interceptOne    <API, INST extends State<API>>(instance: INST & State<API>): WhenClosure<INST, API>;
  // next            <API, INST extends State<API>>(instance: INST & State<API>): WhenClosure<INST, API>;
  // run             <INST extends Named>(instance: INST): Action<Function, void, void>;
  // dispatch        (instance: Named): Action<Function, void, void>;
}
export default EventRegistry;
