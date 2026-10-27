import { handler as inventoryHandler } from "./inventory";
import { handler as historyHandler } from "./signoutHistory";
import { staffBase, inventoryBase, signoutHistoryBase } from "./Airtable";

jest.mock("./Airtable", () => ({
  staffBase: { find: jest.fn() },
  inventoryBase: { select: jest.fn() },
  signoutHistoryBase: { select: jest.fn() },
}));

const selectInventory = inventoryBase.select as jest.Mock;
const selectHistory = signoutHistoryBase.select as jest.Mock;
const findStaff = staffBase.find as jest.Mock;
const assignment = { id: "recAsset", fields: { "Asset Tag": "A1222" } };
const history = {
  id: "recHistory",
  fields: { Staff: ["recTeacher"], "Asset Tag (from Asset)": ["A1222", "A1223"] },
};

function event(params: Record<string, string>): any {
  return { httpMethod: "GET", queryStringParameters: params };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Deliberately no email or name: the links are sufficient.
  findStaff.mockResolvedValue({ get: (field: string) => ({
    Inventory: ["recAsset"],
    "Student Signout History": ["recHistory"],
  }[field]) });
  selectInventory.mockImplementation(({ filterByFormula }) => ({
    eachPage: (page, done) => page(
      filterByFormula === "FALSE()" ? [] : [assignment], () => done(null)
    ),
  }));
  selectHistory.mockReturnValue({ all: async () => [history] });
});

test("finds a directly assigned machine for a teacher without an email", async () => {
  const response = await inventoryHandler(event({ staffId: "recTeacher" }), {} as any);
  expect(findStaff).toHaveBeenCalledWith("recTeacher");
  expect(selectInventory.mock.calls[0][0].filterByFormula).toBe('OR(RECORD_ID()="recAsset")');
  expect(JSON.parse(response.body)).toEqual([assignment]);
});

test("retrieves staff history by linked record IDs and preserves every asset in a group checkout", async () => {
  const response = await historyHandler(event({ staffId: "recTeacher" }), {} as any);
  expect(selectHistory.mock.calls[0][0].filterByFormula).toBe('OR(RECORD_ID()="recHistory")');
  expect(selectHistory.mock.calls[0][0].fields).toContain("Staff");
  expect(JSON.parse(response.body)).toEqual([history]);
});

test("a teacher with no links gets an empty result instead of all inventory", async () => {
  findStaff.mockResolvedValue({ get: () => undefined });
  const response = await inventoryHandler(event({ staffId: "recTeacher" }), {} as any);
  expect(selectInventory.mock.calls[0][0].filterByFormula).toBe("FALSE()");
  expect(JSON.parse(response.body)).toEqual([]);
  await historyHandler(event({ staffId: "recTeacher" }), {} as any);
  expect(selectHistory.mock.calls[0][0].filterByFormula).toBe("FALSE()");
});

test("keeps the existing status filter when querying a teacher's linked history", async () => {
  await historyHandler(event({ staffId: "recTeacher", onlyOut: "true" }), {} as any);
  expect(selectHistory.mock.calls[0][0].filterByFormula).toBe('and(OR(RECORD_ID()="recHistory"),{Status}="Out")');
});

test("rejects an invalid ID before sending a formula to Airtable", async () => {
  await expect(inventoryHandler(event({ staffId: 'recBad"' }), {} as any)).rejects.toThrow("Invalid staff record ID");
  expect(findStaff).not.toHaveBeenCalled();
  expect(selectInventory).not.toHaveBeenCalled();
});
