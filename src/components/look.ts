import RoomState from "./state/roomState";

export function init() {
  if (Memory.delete) {
    console.log("deleting memory");
    for (let key in Memory) {
      delete Memory[key];
    }
  }

  // Check memory for null or out of bounds custom objects
  if (!Memory.uuid || Memory.uuid > 100) {
    Memory.uuid = 0;
  }

  if (!Memory.objects) {
    Memory.objects = {};
  }
}

export function atRoom(room: Room) {
  RoomState.spawn(room);
}
