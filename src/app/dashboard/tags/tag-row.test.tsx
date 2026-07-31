// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  renameTagAction: vi.fn(),
  deleteTagAction: vi.fn(),
}));

import { TagRow } from "./tag-row";

describe("TagRow", () => {
  it("shows the tag name in view mode, with no rename form mounted", () => {
    render(<TagRow tag={{ id: "1", name: "Reembolsável" }} />);

    expect(screen.getByText("Reembolsável")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("switches to an edit form when the edit button is clicked", () => {
    render(<TagRow tag={{ id: "1", name: "Reembolsável" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar etiqueta Reembolsável" }));

    expect(screen.getByRole("textbox", { name: "Nome da etiqueta Reembolsável" })).toHaveValue(
      "Reembolsável",
    );
  });

  it("returns to view mode without saving when Cancelar is clicked", () => {
    render(<TagRow tag={{ id: "1", name: "Reembolsável" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar etiqueta Reembolsável" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Reembolsável")).toBeInTheDocument();
  });

  it("picks up a renamed tag on rerender instead of keeping the stale value", () => {
    const { rerender } = render(<TagRow tag={{ id: "1", name: "Reembolsável" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar etiqueta Reembolsável" }));

    // Simulates the server action's revalidatePath re-rendering this row with the
    // saved name while local `editing` state (unaffected by the server round-trip)
    // stays true — same tag.id, so React reuses this component instance and its
    // uncontrolled input, which otherwise keeps showing the pre-rename value.
    rerender(<TagRow tag={{ id: "1", name: "Reembolsável Renomeado" }} />);

    expect(screen.getByRole("textbox")).toHaveValue("Reembolsável Renomeado");
  });
});
