import { describe, expect, it } from "vitest";
import { WorkspaceRole } from "@prisma/client";

const rank: Record<WorkspaceRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3
};

function can(role: WorkspaceRole, minimum: WorkspaceRole) {
  return rank[role] >= rank[minimum];
}

describe("workspace role hierarchy", () => {
  it("allows owner to perform admin operations", () => {
    expect(can("OWNER", "ADMIN")).toBe(true);
  });

  it("prevents member from admin operations", () => {
    expect(can("MEMBER", "ADMIN")).toBe(false);
  });

  it("allows all members to read workspace data", () => {
    expect(can("MEMBER", "MEMBER")).toBe(true);
    expect(can("ADMIN", "MEMBER")).toBe(true);
    expect(can("OWNER", "MEMBER")).toBe(true);
  });
});
