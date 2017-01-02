import Goal from "../goal";
import SourceState from "../../state/sourceState";

export default class SourceEnergyTransportVelocity implements Goal<SourceState> {
  public subject: SourceState;
  public resources: any[];
  public resourceGoals: Goal<any>[][];

  public addResource<X>(resource: X): Goal<X>[] {
    resource = resource;

    return [];
  }
}
