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
export function getApiName(func: Function): string|undefined {
  switch (func) {
    case Creep:
      return "Creep";
    case Room:
      return "Room";
    default:
  }

  return undefined;
}

export default function getType(name: string): Constructor<any>|undefined {
  const typeFunction = types[name];
  if (typeFunction !== undefined) {
    return typeFunction;
  }

  switch (name) {
    case "Creep":
      return Creep as Constructor<Creep>;
    case "Room":
      return Room as Constructor<Room>;
    default:
  }

  return undefined;
}

// protected static _classes: { [name: string]: (id: string) => Named } = {};
