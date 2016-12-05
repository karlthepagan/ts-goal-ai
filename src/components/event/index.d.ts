import Named from "../named";
import State from "../state/abstractState";

type ScheduledFunction = (args: any[]) => void;

type OnMove<R> = (jp: Joinpoint<void>, fromPos: RoomPosition, forwardDir: number, ...args: any[]) => R;
type OnSpawn<R> = (jp: Joinpoint<string>, ...args: any[]) => R;

export interface Schedule<INST> extends CallbackRegistry {
  /**
   * creep to be spawned
   */
  onSpawn(): ActionChain<OnSpawn<void>, Schedule<INST>>;
  /**
   * creep will die
   */
  onDeath(): ActionChain<OnMove<void>, Schedule<INST>>;
  /**
   * energy will be full
   */
  onFull(): ActionChain<OnMove<void>, Schedule<INST>>;
  /**
   * energy will be empty
   */
  onEmpty(): ActionChain<OnMove<void>, Schedule<INST>>;
  /**
   * creep moved in last tick
   * TODO ambiguous with the command? before -> after
   */
  onMove(): ActionChain<OnMove<void>, Schedule<INST>>;
  /**
   * fatigue was high but is now zero
   */
  onRested(): ActionChain<OnMove<void>, Schedule<INST>>;
  /**
   * structure will decay
   */
  onDecay(): ActionChain<OnMove<void>, Schedule<INST>>;
}

export interface FailureEvents extends Registry {
  createCreep(failureCode: number, body: string[], name?: string, mem?: any): void;
  move(failureCode: number, direction: number): void;
  // TODO route planning failure?
  moveTo(failureCode: number, target: RoomPosition | { pos: RoomPosition; }, opts?: MoveToOpts & FindPathOpts): void;
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
  thenCall      (callback: CALLBACK, ...args: any[]): Action<CALLBACK, TYPE, SELECT>;
  // thenCall      (thisArg: Named, callback: CALLBACK, ...args: any[]): SELECT;
  thenWait      (relativeTime: number): Action<CALLBACK, TYPE, SELECT>;
  filterOn      (thisARg: Named, callback: CALLBACK, ...args: any[]): SELECT; // illegal for When.after or Schedule
  or            (): SELECT;
  andThen       (): SELECT; // illegal for When.before
  // TODO tap
  andIntercept  <INST extends State<any>>(instance: State<any>): When<ApiCalls<INST>>; // NEW SUBJECT, JOIN
  andSchedule   <INST extends Named>(relativeTime: number, instance: INST): Schedule<INST>;
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
  schedule  <INST extends Named>(relativeTime: number, instance: INST): Schedule<INST>;
  intercept <INST extends State<any>>(instance: INST): When<ApiCalls<INST>>;
  next      <INST extends State<any>>(instance: INST): When<ApiCalls<INST>>;
  run       <INST extends Named>(instance: INST): Action<Function, void, void>;
  dispatch  (instance: Named): TriggeredEvents;
}
export default EventRegistry;

/*
 * chaining api options
 * - different actors
 * - time delay
 * - or
 * - ?
 */
