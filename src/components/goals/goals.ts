import {CandidateFactory, GoalFactory} from "../filters";
import GoalState from "../state/goalState";
import RoomState from "../state/roomState";
import CreepState from "../state/creepState";

export const goalStateActors: CandidateFactory<GoalState> = {};
export const roomStateActors: CandidateFactory<RoomState> = {};
export const creepStateActors: CandidateFactory<CreepState> = {};

// goal constructors, registered by implementing modules
export const goals: GoalFactory<any> = {};
