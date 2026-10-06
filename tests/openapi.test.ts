import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { openApiDocument } from "../src/lib/openapi";
import { configSchema } from "../src/lib/engine";
import { hasSecret } from "../scripts/secret-patterns.mjs";

test("OpenAPI documents every actual route and handler without inventing operations", () => {
  const apiRoot = path.resolve("src/app/api");
  const actual = new Map<string, string[]>();
  function walk(folder: string) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name === "route.ts") {
        const route =
          "/api/" +
          path
            .relative(apiRoot, path.dirname(file))
            .split(path.sep)
            .map((segment) => segment.replace(/^\[(.+)\]$/, "{$1}"))
            .join("/");
        const methods = [
          ...fs
            .readFileSync(file, "utf8")
            .matchAll(
              /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/g,
            ),
        ]
          .map((m) => m[1].toLowerCase())
          .sort();
        actual.set(route, methods);
      }
    }
  }
  walk(apiRoot);
  assert.deepEqual(
    Object.keys(openApiDocument.paths).sort(),
    [...actual.keys()].sort(),
  );
  for (const [route, methods] of actual)
    assert.deepEqual(
      Object.keys(
        (openApiDocument.paths as Record<string, object>)[route],
      ).sort(),
      methods,
      route,
    );
});
test("documented request shape is derived from the validated runner input", () => {
  const schema = openApiDocument.paths["/api/experiments"].post.requestBody
    .content["application/json"].schema as any;
  assert.equal(schema.properties.rows.maxItems, 100);
  assert.equal(schema.properties.modelIds.maxItems, 4);
  assert.equal(configSchema.safeParse(schema.example).success, true);
});
test("streaming and workbook operations document their actual media types", () => {
  assert.ok(
    openApiDocument.paths["/api/experiments"].post.responses["200"].content[
      "application/x-ndjson"
    ],
  );
  assert.ok(
    openApiDocument.paths["/api/experiments/{id}/export"].get.responses["200"]
      .content[
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
  );
});
test("API documentation contains no real credential and retains null measurement examples", () => {
  assert.equal(hasSecret(JSON.stringify(openApiDocument)), false);
  assert.equal(
    openApiDocument.components.schemas.Run.properties.costUsd.example,
    null,
  );
  assert.equal(
    openApiDocument.components.schemas.Run.properties.totalTokens.example,
    null,
  );
});
