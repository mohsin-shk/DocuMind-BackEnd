/**
 * extractionPipeline.test.js
 *
 * Smoke + unit tests for:
 *   - txt.extractor.js
 *   - docx.extractor.js
 *   - pdf.extractor.js
 *   - extractText.js  (the MIME router)
 *   - chunkText.js    (the chunker)
 *
 * Runner : Node built-in (node:test) — zero extra dependencies.
 * Command: node src/ai/tests/extractionPipeline.test.js
 *
 * Sample files required (place them in your project root, i.e. next to package.json):
 *   sample.txt   — any plain-text file with real content (> 100 chars)
 *   sample.docx  — any Word document with real content
 *   sample.pdf   — any text-based PDF (not a scanned image)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "url";
import { writeFile, unlink } from "fs/promises";

// ─── Resolve paths ────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/*
  Test lives at:  src/ai/tests/extractionPipeline.test.js
  3 levels up  →  backend/   (your project root, next to package.json)
  That is where sample.txt / sample.docx / sample.pdf must be placed.
*/
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

const TXT_PATH  = path.join(PROJECT_ROOT, "sample.txt");
const DOCX_PATH = path.join(PROJECT_ROOT, "sample.docx");
const PDF_PATH  = path.join(PROJECT_ROOT, "sample.pdf");

// ─── Imports under test ───────────────────────────────────────────────────────
import { extractTextFromTXT  } from "../extractors/txt.extractor.js";
import { extractTextFromDOCX } from "../extractors/docx.extractor.js";
import { extractTextFromPDF  } from "../extractors/pdf.extractor.js";
import { extractText         } from "../extractText.js";
import { chunkText           } from "../../utils/chunkText.js";
import { ApiError            } from "../../utils/ApiError.js";

// ─── Shared state (populated by first successful extraction) ──────────────────
// We extract once and reuse the text across chunkText tests to keep things fast.
let txtText  = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Assert a result object has the shape every extractor must return */
function assertExtractionShape(result, label) {
  assert.ok(result,                              `[${label}] result must not be null`);
  assert.ok(typeof result.text === "string",     `[${label}] result.text must be a string`);
  assert.ok(result.text.length > 0,              `[${label}] result.text must not be empty`);
  assert.ok(typeof result.metadata === "object", `[${label}] result.metadata must be an object`);
}

/** Assert chunkText output has the correct shape */
function assertChunkShape({ chunks, metadata }, label) {
  assert.ok(Array.isArray(chunks),                    `[${label}] chunks must be an array`);
  assert.ok(chunks.length > 0,                        `[${label}] must produce at least 1 chunk`);
  assert.ok(typeof metadata === "object",             `[${label}] metadata must be an object`);
  assert.ok(typeof metadata.totalChunks === "number", `[${label}] metadata.totalChunks must be a number`);
  assert.equal(metadata.totalChunks, chunks.length,  `[${label}] totalChunks must match chunks.length`);

  for (const chunk of chunks) {
    assert.ok(typeof chunk.chunkIndex === "number", `[${label}] each chunk needs chunkIndex`);
    assert.ok(typeof chunk.text === "string",        `[${label}] each chunk needs text`);
    assert.ok(chunk.text.length > 0,                 `[${label}] each chunk text must be non-empty`);
    assert.ok(typeof chunk.length === "number",      `[${label}] each chunk needs a length field`);
    assert.equal(chunk.length, chunk.text.length,    `[${label}] chunk.length must equal chunk.text.length`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TXT EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════════
describe("TXT Extractor", () => {

  test("extracts text from a valid .txt file", async () => {
    const result = await extractTextFromTXT(TXT_PATH);
    assertExtractionShape(result, "TXT");

    // Cache for reuse in chunkText tests (avoids re-reading the file)
    txtText = result.text;

    console.log(`  ✔  TXT extracted ${result.text.length} chars`);
    console.log(`     preview: "${result.text.slice(0, 80)}..."`);
  });

  test("throws ApiError(400) for a whitespace-only TXT file", async () => {
    const emptyPath = path.join(PROJECT_ROOT, "_empty_test.txt");
    await writeFile(emptyPath, "   \n   "); // whitespace only

    try {
      await extractTextFromTXT(emptyPath);
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name} — ${err.message}`);
      assert.equal(err.statusCode, 400, `Expected 400, got ${err.statusCode}`);
    } finally {
      await unlink(emptyPath).catch(() => {});
    }
  });

  test("throws ApiError(500) for a non-existent file", async () => {
    try {
      await extractTextFromTXT(path.join(PROJECT_ROOT, "__does_not_exist__.txt"));
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 500, `Expected 500, got ${err.statusCode}`);
    }
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DOCX EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════════
describe("DOCX Extractor", () => {

  test("extracts text from a valid .docx file", async () => {
    const result = await extractTextFromDOCX(DOCX_PATH);
    assertExtractionShape(result, "DOCX");

    // No content-string assertion here — we don't know what's in YOUR docx.
    // Shape + non-empty is the right contract to test.
    console.log(`  ✔  DOCX extracted ${result.text.length} chars`);
    console.log(`     preview: "${result.text.slice(0, 80)}..."`);
  });

  test("throws ApiError(500) for a non-existent file", async () => {
    try {
      await extractTextFromDOCX(path.join(PROJECT_ROOT, "__does_not_exist__.docx"));
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 500, `Expected 500, got ${err.statusCode}`);
    }
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PDF EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════════
describe("PDF Extractor", () => {

  test("extracts text from a valid .pdf file", async () => {
    const result = await extractTextFromPDF(PDF_PATH);
    assertExtractionShape(result, "PDF");

    assert.ok(typeof result.metadata.pageCount === "number",
      "PDF metadata must include a numeric pageCount");
    assert.ok(result.metadata.pageCount >= 1,
      "pageCount must be at least 1");

    console.log(`  ✔  PDF extracted ${result.text.length} chars, pages: ${result.metadata.pageCount}`);
    console.log(`     preview: "${result.text.slice(0, 80)}..."`);
  });

  test("throws ApiError(500) for a non-existent file", async () => {
    try {
      await extractTextFromPDF(path.join(PROJECT_ROOT, "__does_not_exist__.pdf"));
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 500, `Expected 500, got ${err.statusCode}`);
    }
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. extractText ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
describe("extractText router", () => {

  test("routes TXT by mimeType", async () => {
    const result = await extractText({ filePath: TXT_PATH, mimeType: "text/plain" });
    assertExtractionShape(result, "router/TXT");
    assert.equal(result.mimeType, "text/plain", "Must return the resolved mimeType");
    console.log(`  ✔  router → TXT (${result.text.length} chars)`);
  });

  test("routes DOCX by mimeType", async () => {
    const result = await extractText({
      filePath: DOCX_PATH,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    assertExtractionShape(result, "router/DOCX");
    console.log(`  ✔  router → DOCX (${result.text.length} chars)`);
  });

  test("routes PDF by mimeType", async () => {
    const result = await extractText({ filePath: PDF_PATH, mimeType: "application/pdf" });
    assertExtractionShape(result, "router/PDF");
    console.log(`  ✔  router → PDF (${result.text.length} chars)`);
  });

  test("falls back to file extension when mimeType is application/octet-stream", async () => {
    const result = await extractText({
      filePath: TXT_PATH,
      mimeType: "application/octet-stream",
    });
    assertExtractionShape(result, "router/octet-stream fallback");
    assert.equal(result.mimeType, "text/plain",
      "Must resolve mimeType from .txt extension");
    console.log(`  ✔  router → octet-stream resolved to text/plain`);
  });

  test("throws ApiError(415) for an unsupported MIME type", async () => {
    try {
      await extractText({ filePath: TXT_PATH, mimeType: "image/png" });
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 415, `Expected 415, got ${err.statusCode}`);
    }
  });

  test("throws ApiError(400) when filePath is missing", async () => {
    try {
      await extractText({ filePath: "", mimeType: "text/plain" });
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 400, `Expected 400, got ${err.statusCode}`);
    }
  });

  test("throws ApiError(400) when mimeType is missing", async () => {
    try {
      await extractText({ filePath: TXT_PATH, mimeType: "" });
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 400, `Expected 400, got ${err.statusCode}`);
    }
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. chunkText
// ═══════════════════════════════════════════════════════════════════════════════
describe("chunkText", () => {

  /*
   * These tests extract the TXT file inline rather than relying on txtText
   * being set by a previous test suite — node:test suites can run in
   * parallel, so shared state across describe blocks is unreliable.
   */

  test("chunks a long text with default settings", async () => {
    const { text } = await extractTextFromTXT(TXT_PATH);
    const output = await chunkText({ text });
    assertChunkShape(output, "chunkText/defaults");

    assert.equal(output.metadata.chunkSize,   1000, "Default chunkSize should be 1000");
    assert.equal(output.metadata.chunkOverlap, 200, "Default chunkOverlap should be 200");

    console.log(`  ✔  chunkText: ${output.chunks.length} chunks, avg ${output.metadata.avgChunkLength} chars`);
    output.chunks.forEach((c) => {
      console.log(`     [chunk ${c.chunkIndex}] ${c.length} chars | "${c.text.slice(0, 60)}..."`);
    });
  });

  test("respects custom chunkSize and chunkOverlap", async () => {
    const { text } = await extractTextFromTXT(TXT_PATH);
    const output = await chunkText({ text, chunkSize: 300, chunkOverlap: 50 });
    assertChunkShape(output, "chunkText/custom-size");

    for (const chunk of output.chunks) {
      assert.ok(chunk.length <= 300,
        `Chunk ${chunk.chunkIndex} is ${chunk.length} chars — exceeds chunkSize 300`);
    }
    assert.ok(output.chunks.length >= 2, "chunkSize=300 on a real file should produce >= 2 chunks");
    console.log(`  ✔  chunkText (size=300): ${output.chunks.length} chunks`);
  });

  test("chunkIndex values are sequential starting from 0", async () => {
    const { text } = await extractTextFromTXT(TXT_PATH);
    const { chunks } = await chunkText({ text, chunkSize: 300, chunkOverlap: 50 });

    chunks.forEach((chunk, i) => {
      assert.equal(chunk.chunkIndex, i,
        `Expected chunkIndex ${i}, got ${chunk.chunkIndex}`);
    });
  });

  test("no chunk is shorter than minChunkLength", async () => {
    const { text } = await extractTextFromTXT(TXT_PATH);
    const minChunkLength = 80;
    const { chunks } = await chunkText({ text, chunkSize: 300, chunkOverlap: 50, minChunkLength });

    for (const chunk of chunks) {
      assert.ok(chunk.length >= minChunkLength,
        `Chunk ${chunk.chunkIndex} is ${chunk.length} chars — below minChunkLength ${minChunkLength}`);
    }
  });

  test("throws ApiError(400) for empty/whitespace-only text", async () => {
    try {
      await chunkText({ text: "   " });
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 400, `Expected 400, got ${err.statusCode}`);
    }
  });

  test("throws ApiError(400) when chunkOverlap >= chunkSize", async () => {
    try {
      await chunkText({ text: "some valid text here", chunkSize: 100, chunkOverlap: 100 });
      assert.fail("Should have thrown ApiError");
    } catch (err) {
      assert.ok(err instanceof ApiError, `Expected ApiError, got: ${err.constructor.name}`);
      assert.equal(err.statusCode, 400, `Expected 400, got ${err.statusCode}`);
    }
  });

  // ── Full pipeline: extract → chunk (end-to-end per file type) ────────────────
  describe("Full pipeline (extract → chunk)", () => {

    test("TXT → chunk", async () => {
      const { text } = await extractText({ filePath: TXT_PATH, mimeType: "text/plain" });
      const output   = await chunkText({ text, chunkSize: 400, chunkOverlap: 80 });
      assertChunkShape(output, "pipeline/TXT");
      console.log(`  ✔  TXT pipeline: ${output.chunks.length} chunks from ${text.length} chars`);
    });

    test("DOCX → chunk", async () => {
      const { text } = await extractText({
        filePath: DOCX_PATH,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const output = await chunkText({ text, chunkSize: 400, chunkOverlap: 80 });
      assertChunkShape(output, "pipeline/DOCX");
      console.log(`  ✔  DOCX pipeline: ${output.chunks.length} chunks from ${text.length} chars`);
    });

    test("PDF → chunk", async () => {
      const { text } = await extractText({ filePath: PDF_PATH, mimeType: "application/pdf" });
      const output   = await chunkText({ text, chunkSize: 400, chunkOverlap: 80 });
      assertChunkShape(output, "pipeline/PDF");
      console.log(`  ✔  PDF pipeline: ${output.chunks.length} chunks from ${text.length} chars`);
    });

  });

});