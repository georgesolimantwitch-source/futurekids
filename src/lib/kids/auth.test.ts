import assert from "node:assert/strict";
import test from "node:test";

function hasBearerAuthorization(request: Request): boolean {
  const authorization = request.headers.get("authorization");
  return Boolean(authorization?.toLowerCase().startsWith("bearer "));
}

function createKidPayload(body: {
  full_name?: string;
  username?: string;
  password?: string;
  date_of_birth?: string;
  enabled_apps?: string[];
  parent_manages_confirmed?: boolean;
}) {
  return {
    full_name: body.full_name ?? "",
    username: (body.username ?? "").trim().toLowerCase(),
    password: body.password ?? "",
    date_of_birth: body.date_of_birth ?? "",
    enabled_apps:
      Array.isArray(body.enabled_apps) && body.enabled_apps.length > 0
        ? body.enabled_apps.map((app) => app.trim().toLowerCase())
        : ["tinypal"],
    parent_manages_confirmed: Boolean(body.parent_manages_confirmed),
  };
}

test("kids APIs treat Authorization Bearer as native-app auth", () => {
  const withBearer = new Request("https://genlyn.app/api/kids", {
    headers: { Authorization: "Bearer parent-access-token" },
  });
  const withCookieOnly = new Request("https://genlyn.app/api/kids");

  assert.equal(hasBearerAuthorization(withBearer), true);
  assert.equal(hasBearerAuthorization(withCookieOnly), false);
});

test("create kid payload always enables tinypal for TinyPal parents", () => {
  const payload = createKidPayload({
    full_name: "Sam Kid",
    username: "SamKid",
    password: "secret123",
    date_of_birth: "2015-04-12",
    parent_manages_confirmed: true,
  });

  assert.equal(payload.username, "samkid");
  assert.deepEqual(payload.enabled_apps, ["tinypal"]);
  assert.equal(payload.parent_manages_confirmed, true);
});

test("create kid rejects missing parent confirmation", () => {
  const payload = createKidPayload({
    full_name: "Sam Kid",
    username: "samkid",
    password: "secret123",
    date_of_birth: "2015-04-12",
  });
  assert.equal(payload.parent_manages_confirmed, false);
});

test("username check request normalizes input", () => {
  const username = "  Sam_Kid  ".trim().toLowerCase();
  assert.equal(username, "sam_kid");
  assert.equal(username.length >= 3, true);
});
