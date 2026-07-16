import { Types } from "mongoose";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import { PlacementEligibilityAdapter } from "src/hb-backend-api/review/adapters/out/placement-eligibility.adapter";

const SHELTER = new Types.ObjectId().toHexString();
const ADOPTER = new Types.ObjectId().toHexString();
const REF = new Types.ObjectId().toHexString();

const placement = (
  status: AdoptionApplicationStatus | FosterApplicationStatus,
) =>
  ({
    getShelterId: { toString: () => SHELTER },
    getApplicantId: { toString: () => ADOPTER },
    getStatus: status,
  }) as unknown as AdoptionApplication & FosterApplication;

describe("PlacementEligibilityAdapter", () => {
  let adoptionQueryPort: jest.Mocked<AdoptionApplicationQueryPort>;
  let fosterQueryPort: jest.Mocked<FosterApplicationQueryPort>;
  let adapter: PlacementEligibilityAdapter;

  beforeEach(() => {
    adoptionQueryPort = {
      findById: jest.fn(),
      countByApplicantAndStatus: jest.fn(),
      countByShelterAndStatus: jest.fn(),
      countByShelterAndStatusBetween: jest.fn(),
      countByStatus: jest.fn(),
      countByStatusBetween: jest.fn(),
    };
    fosterQueryPort = {
      findById: jest.fn(),
      countByApplicantAndStatus: jest.fn(),
      countByShelterAndStatus: jest.fn(),
      countByStatus: jest.fn(),
    };
    adapter = new PlacementEligibilityAdapter(
      adoptionQueryPort,
      fosterQueryPort,
    );
  });

  it("maps an APPROVED adoption to a completed placement", async () => {
    adoptionQueryPort.findById.mockResolvedValue(
      placement(AdoptionApplicationStatus.APPROVED),
    );

    const record = await adapter.find(PlacementType.ADOPTION, REF);

    expect(record).toEqual({
      shelterId: SHELTER,
      adopterId: ADOPTER,
      completed: true,
    });
  });

  it("marks a non-APPROVED adoption as not completed", async () => {
    adoptionQueryPort.findById.mockResolvedValue(
      placement(AdoptionApplicationStatus.PENDING),
    );

    const record = await adapter.find(PlacementType.ADOPTION, REF);

    expect(record?.completed).toBe(false);
  });

  it("returns null when the placement does not exist", async () => {
    adoptionQueryPort.findById.mockResolvedValue(null);
    expect(await adapter.find(PlacementType.ADOPTION, REF)).toBeNull();
  });

  it("routes FOSTER placements to the foster query port", async () => {
    fosterQueryPort.findById.mockResolvedValue(
      placement(FosterApplicationStatus.APPROVED),
    );

    const record = await adapter.find(PlacementType.FOSTER, REF);

    expect(adoptionQueryPort.findById).not.toHaveBeenCalled();
    expect(record?.completed).toBe(true);
  });
});
