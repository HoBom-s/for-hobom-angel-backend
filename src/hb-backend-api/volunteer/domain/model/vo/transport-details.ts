import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * The extra logistics an OVERSEAS relocation ("이동봉사") carries: where the
 * flight leaves from and lands, when it departs, which of the shelter's animals
 * travel, and any qualification the volunteer must meet. Held only by OVERSEAS
 * events; GENERAL events have none. Immutable — a change means a new event.
 *
 * `animalIds` are soft references to the shelter's Animal aggregates; they are
 * stored opaquely and not dereferenced here.
 */
export class TransportDetails {
  private constructor(
    private readonly departure: string,
    private readonly arrival: string,
    private readonly flightAt: Date,
    private readonly animalIds: readonly AnimalId[],
    private readonly qualification: string | null,
  ) {
    Object.freeze(this);
    Object.freeze(this.animalIds);
  }

  public static of(params: {
    departure: string;
    arrival: string;
    flightAt: Date;
    animalIds: AnimalId[];
    qualification?: string | null;
  }): TransportDetails {
    const departure = params.departure?.trim();
    const arrival = params.arrival?.trim();
    if (!departure) {
      throw new InvalidInputError("출발지가 필요해요.");
    }
    if (!arrival) {
      throw new InvalidInputError("도착지가 필요해요.");
    }
    if (
      !(params.flightAt instanceof Date) ||
      Number.isNaN(params.flightAt.getTime())
    ) {
      throw new InvalidInputError("항공편 시각이 올바르지 않아요.");
    }
    return new TransportDetails(
      departure,
      arrival,
      params.flightAt,
      [...params.animalIds],
      params.qualification?.trim() || null,
    );
  }

  public get getDeparture(): string {
    return this.departure;
  }
  public get getArrival(): string {
    return this.arrival;
  }
  public get getFlightAt(): Date {
    return this.flightAt;
  }
  public get getAnimalIds(): readonly AnimalId[] {
    return this.animalIds;
  }
  public get getAnimalCount(): number {
    return this.animalIds.length;
  }
  public get getQualification(): string | null {
    return this.qualification;
  }
}
