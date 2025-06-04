import * as assert from "assert";
import { isValidFilePath } from "../utils";

suite("isValidFilePath", () => {
  test("valid file names return true", () => {
    assert.strictEqual(isValidFilePath("file.txt"), true);
    assert.strictEqual(isValidFilePath("README"), true);
    assert.strictEqual(isValidFilePath("nested/path/name.js"), true);
    assert.strictEqual(isValidFilePath(""), true);
  });

  test("invalid file names return false", () => {
    assert.strictEqual(isValidFilePath("file<name>.txt"), false);
    assert.strictEqual(isValidFilePath("name|pipe.js"), false);
    assert.strictEqual(isValidFilePath("bad:file.ts"), false);
    assert.strictEqual(isValidFilePath("invalid?file.txt"), false);
    assert.strictEqual(isValidFilePath("what*is*that.txt"), false);
    assert.strictEqual(isValidFilePath('"quoted".ts'), false);
  });

  test("non-string inputs return false", () => {
    assert.strictEqual(isValidFilePath(undefined as any), false);
    assert.strictEqual(isValidFilePath(null as any), false);
    assert.strictEqual(isValidFilePath(123 as any), false);
    assert.strictEqual(isValidFilePath({} as any), false);
  });
});
