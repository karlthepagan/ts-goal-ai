import InterceptorService from "./event/impl/interceptorService";
import EventManager from "./event/eventManager";
import ImportManager from "./import/importManager";
import MapManager from "./map/mapManager";
import ScoreManager from "./score/scoreManager";

export const interceptorService = new InterceptorService();
export const eventManager = new EventManager();
export const importManager = new ImportManager();
export const maps = new MapManager();
export const scoreManager = new ScoreManager();
