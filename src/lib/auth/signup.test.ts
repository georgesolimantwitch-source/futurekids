import assert from "node:assert/strict";
import test from "node:test";
import { resolveSetupAccountType } from "@/lib/auth/signup";

test("website setup always forces parent even if client sends individual", () => {
  assert.equal(
    resolveSetupAccountType({ accountType: "individual", source: "website" }),
    "parent",
  );
  assert.equal(
    resolveSetupAccountType({ accountType: "individual", source: null }),
    "parent",
  );
});

test("native app signup can create individual accounts", () => {
  assert.equal(
    resolveSetupAccountType({ accountType: "individual", source: "native_app" }),
    "individual",
  );
  assert.equal(
    resolveSetupAccountType({ accountType: "parent", source: "native_app" }),
    "parent",
  );
});
