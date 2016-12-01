import EventManager from "./eventManager";
import {botMemory} from "../../config/config";

export const eventManager = new EventManager(botMemory());
