import State from "../state/abstractState";
import * as F from "../functions";
import {botMemory} from "../../config/config";
import {AnyEvent} from "./impl/eventSpec";
import ScheduleSpec from "./impl/scheduledSpec";
import GlobalState from "../state/globalState";
import ScoreManager from "../score/scoreManager";
import * as Debug from "../util/debug";
import {interceptorService} from "../singletons";

export function globalLifecycle(state: State<any>, lifecycle: number) {
  switch (lifecycle) {
    case State.LIFECYCLE_NEW:
      Debug.error("something born", state);
      break;

    case State.LIFECYCLE_FREE:
      Debug.error("something died", state);
      break;

    case State.LIFECYCLE_HIDDEN:
      Debug.error("something is hidden", state);
      break;

    default:
      throw new Error("unknown lifecycle=" + lifecycle);
  }
}

export function dispatchTick(time: number) {
  interceptorService.dispatchTick(time);
}

export function registerBehavior(name: string, spec: AnyEvent) {
  interceptorService.register(name, spec);
}

export function scheduleExec(name: string, spec: ScheduleSpec<any, any>) {
  name = name; // TODO log or pass thru?
  interceptorService.scheduleExec(spec);
}

export function detectChanges(state: GlobalState, score: ScoreManager<GlobalState>) {
  score = score;
  // TODO call this after dispatchTick? or as a scheduled tick (but low pirority)

  const changes = state.getChanges();
  for (let i = changes.length - 1; i >= 0; i--) {
    switch (changes[i]) {
      case GlobalState.CHANGED_FLAGS:
        state.flags().value(); // TODO lifecycle?
        // TODO temp?
        state.sources().map(function(s) {
          Debug.always("flag added"); // rescoring all states
          return s.getOrRescore(undefined, Game.time);
        }).value();
        break;
      case GlobalState.CHANGED_SITES:
        Debug.always("something built"); // sites changed
        state.sites().value();
        break;
      case GlobalState.CHANGED_CREEPS:
        // creeps died?!
        state.bodies().map(function(s) {
          if (!s.resolve(globalLifecycle)) {
            // creep died!
            Debug.error("DIED!");
          }
        });
        break;
      case GlobalState.CHANGED_STRUCTURES:
        // structure died?!
        state.ruins().map(function(s) {
          if (!s.resolve(globalLifecycle)) {
            // structure died!
            Debug.error("DESTROYED!");
          }
        });
        break;
      default:
        break;
    }
  }
}

export default function api<T>(subject: State<T>): T {
  const opts = F.elvis(botMemory().config, {}) as Options;

  if (opts.disableBehaviors) {
    return subject.subject();
  } else {
    return new Proxy(subject, interceptorService) as any;
  }
}

// http://support.screeps.com/hc/en-us/articles/203137792-Simultaneous-execution-of-creep-actions
// http://support.screeps.com/hc/en-us/articles/207023879-PathFinder
