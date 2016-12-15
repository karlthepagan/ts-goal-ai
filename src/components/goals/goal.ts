interface Goal<T> {
  subject: T;
  resources: any[];
  resourceGoals: Goal<any>[][];

  addResource<X>(resource: X): Goal<X>[];
}

export default Goal;
