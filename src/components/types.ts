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

// TODO Constructor<any> ?
export function getApiName(obj: any): string|undefined {
  if (Creep.prototype === obj.prototype) {
    return "Creep";
  }
  if (Spawn.prototype === obj.prototype) {
    return "Spawn";
  }
  if (Room.prototype === obj.prototype) {
    return "Room";
  }
  if (ConstructionSite.prototype === obj.prototype) {
    return "ConstructionSite";
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
