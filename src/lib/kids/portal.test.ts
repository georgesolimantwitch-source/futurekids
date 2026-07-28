import assert from "node:assert/strict";
import test from "node:test";
import { isKidAppKey } from "@/lib/kids/types";
import { isStrongChildPassword } from "@/lib/kids/portal";

test("kid app keys are recognized", () => {
  assert.equal(isKidAppKey("ballr"), true);
  assert.equal(isKidAppKey("earnly"), true);
  assert.equal(isKidAppKey("unknown"), false);
});

test("child password rules require letter and number", () => {
  assert.equal(isStrongChildPassword("abcdefg1"), true);
  assert.equal(isStrongChildPassword("short1"), false);
  assert.equal(isStrongChildPassword("abcdefgh"), false);
  assert.equal(isStrongChildPassword("12345678"), false);
});
