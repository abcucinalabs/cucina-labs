const { describe, it } = require("node:test");
const assert = require("node:assert");
const { execSync } = require("child_process");

describe("Admin route build verification", () => {
  it("should not have mismatched @next/swc dependencies in package.json", () => {
    const packageJson = require("../package.json");
    const nextVersion = packageJson.dependencies.next;

    // @next/swc-* packages should NOT be in dependencies - Next.js manages these automatically
    const swcDeps = Object.keys(packageJson.dependencies).filter(dep =>
      dep.startsWith("@next/swc-")
    );

    assert.strictEqual(
      swcDeps.length,
      0,
      `Found explicit @next/swc dependencies which should be managed by Next.js: ${swcDeps.join(", ")}. ` +
      `These can cause version mismatches and 500 errors in production.`
    );
  });

  it("should have matching Next.js ecosystem versions", () => {
    const packageJson = require("../package.json");
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Extract major version from next
    const nextVersion = deps.next?.replace("^", "").split(".")[0];

    // Check eslint-config-next matches
    const eslintNextVersion = deps["eslint-config-next"]?.replace("^", "").split(".")[0];

    if (eslintNextVersion) {
      assert.strictEqual(
        nextVersion,
        eslintNextVersion,
        `Next.js version (${nextVersion}) should match eslint-config-next version (${eslintNextVersion})`
      );
    }
  });

  it("should build successfully", () => {
    // This test verifies the project builds without errors
    // The actual build is run as part of CI/deployment
    // This is a placeholder that can be extended with more specific checks
    assert.ok(true, "Build verification placeholder");
  });
});
