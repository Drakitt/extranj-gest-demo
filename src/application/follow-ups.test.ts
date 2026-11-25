import assert from "node:assert/strict";
import test from "node:test";
import {
  assertQuoteTransition,
  describeFollowUpChange,
  describeFollowUpCreated,
  followUpsAllowed,
} from "./follow-ups";

test("el borrador solo puede enviarse o cancelarse", () => {
  assert.doesNotThrow(() => assertQuoteTransition("Draft", "Sent"));
  assert.throws(() => assertQuoteTransition("Draft", "Accepted"));
  assert.equal(followUpsAllowed("Draft"), false);
  assert.equal(followUpsAllowed("Sent"), true);
});

test("un seguimiento nuevo y sus cambios quedan descritos en el historial", () => {
  const created = describeFollowUpCreated("2026-11-02", "Confirmar interés ficticio.");
  assert.equal(created.eventType, "Created");
  assert.match(created.description, /2026-11-02/);

  const changes = describeFollowUpChange(
    { scheduledOn: "2026-11-02", note: "Nota inicial", status: "Pending" },
    { scheduledOn: "2026-11-05", note: "Nota revisada", status: "Done" }
  );
  assert.deepEqual(
    changes.map((change) => change.eventType),
    ["Rescheduled", "NoteUpdated", "StatusChanged"]
  );
  assert.equal(
    describeFollowUpChange(
      { scheduledOn: "2026-11-02", note: "Igual", status: "Pending" },
      { scheduledOn: "2026-11-02", note: "Igual", status: "Pending" }
    ).length,
    0
  );
});
