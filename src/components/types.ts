const types: any = {};

export function registerType<T>(type: Constructor<T>) {
  const typeName = type.name;
  if (types[typeName] !== undefined) {
    throw new Error("already registered " + typeName);
  }
  types[typeName] = type;
}

export function registerTypeAs<T>(type: Constructor<T>, alias: string) {
  const typeName = type.name;
  if (types[typeName] === undefined) {
    throw new Error("not registered " + typeName + ", cannot alias");
  }
  if (types[alias] !== undefined) {
    throw new Error("already registered " + alias + ", cannot reassign");
  }
  types[alias] = type;
}

export function getApiName(obj: any): string|undefined {
  if (ConstructionSite.prototype === obj.prototype) {
    return "ConstructionSite";
  }
  if (Creep.prototype === obj.prototype) {
    return "Creep";
  }
  if (Room.prototype === obj.prototype) {
    return "Room";
  }
  if (Spawn.prototype === obj.prototype) {
    return "Spawn";
  }
  if (StructureContainer.prototype === obj.prototype) {
    return "StructureContainer";
  }
  if (StructureController.prototype === obj.prototype) {
    return "StructureController";
  }
  if (StructureExtension.prototype === obj.prototype) {
    return "StructureExtension";
  }
  if (StructureLab.prototype === obj.prototype) {
    return "StructureLab";
  }
  if (StructureLink.prototype === obj.prototype) {
    return "StructureLink";
  }
  if (StructureObserver.prototype === obj.prototype) {
    return "StructureObserver";
  }
  if (StructurePowerSpawn.prototype === obj.prototype) {
    return "StructurePowerSpawn";
  }
  if (StructureRampart.prototype === obj.prototype) {
    return "StructureRampart";
  }
  if (StructureStorage.prototype === obj.prototype) {
    return "StructureStorage";
  }
  if (StructureTerminal.prototype === obj.prototype) {
    return "StructureTerminal";
  }
  if (StructureTower.prototype === obj.prototype) {
    return "StructureTower";
  }

  return undefined;
}

export default function getConstructor(className: string): Constructor<any>|undefined {
  const typeFunction = types[className];
  if (typeFunction !== undefined) {
    return typeFunction;
  }

  switch (className) {
    case "Creep":
      return Creep as Constructor<Creep>;
    case "Room":
      return Room as Constructor<Room>;
    default:
  }

  return undefined;
}

// protected static _classes: { [name: string]: (id: string) => Named } = {};
