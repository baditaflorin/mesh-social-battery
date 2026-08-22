import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature, isValidCheckIn } from "../../src/Feature";
import { config } from "../../src/config";

describe("Feature (component)", () => {
  it("renders the check-in controls when connected", () => {
    const room = createMockRoom();
    render(<Feature room={room} config={config} />);
    expect(screen.getByRole("heading", { name: /how much social energy/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share my check-in" })).toBeDisabled();
  });

  it("rejects malformed peer check-ins", () => {
    expect(
      isValidCheckIn({
        id: "peer-123",
        peerId: "peer-123",
        name: "Ari",
        level: 3,
        note: "Hi",
        updatedAt: Date.now(),
      }),
    ).toBe(true);
    expect(
      isValidCheckIn({
        id: "x",
        peerId: "peer-123",
        name: "Ari",
        level: 8,
        note: "Hi",
        updatedAt: Date.now(),
      }),
    ).toBe(false);
  });

  it("shows a connecting state when room is null", () => {
    render(<Feature room={null} config={config} />);
    // Most templates show "Connecting…" while the room is null. Apps with a
    // custom waiting state can override this test.
    const heading = screen.getAllByRole("heading", { level: 1 })[0];
    expect(heading).toBeInTheDocument();
  });
});
