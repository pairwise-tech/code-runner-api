import fs from "fs";
import { ShellString } from "shelljs";

/** ===========================================================================
 * Shared Utils
 * ============================================================================
 */

// A global cache used to memoize code -> result combinations to reduce
// compute time and overhead
const globalCodeCache = new Map();

const defaultFailureResult = {
  passed: false,
  previewOutput: {
    code: 1,
    stdout: "",
    stderr: "An error occurred attempting to evaluate the challenge.",
  },
  testOutput: {
    code: 1,
    stdout: "",
    stderr: "An error occurred attempting to evaluate the challenge.",
  },
};

const removeWhitespace = (x: string) => x.replace(/ /gi, "");

/**
 * Create a unique code key by stringify-ing the code and the strings and
 * removing all whitespace.
 */
const createCodeKey = (codeString: string, testString: string) => {
  return removeWhitespace(codeString + testString);
};

/**
 * Wrap the code execution runner in a try catch statement and provide
 * caching support to minimize compute time.
 */
export const tryCatchCodeExecution = (
  testFn: (codeString: string, testString: string) => Promise<TestResult>
) => {
  return async (codeString: string, testString: string) => {
    try {
      // First compute a key from the input code strings and check if this
      // combination has been tested previously and recorded in the cache
      const codeKey = createCodeKey(codeString, testString);
      if (globalCodeCache.has(codeKey)) {
        return globalCodeCache.get(codeKey);
      }

      // If not, compute the result
      const result = await testFn(codeString, testString);

      // Cache the result first, and then return it
      globalCodeCache.set(codeKey, result);

      return result;
    } catch (err) {
      return defaultFailureResult;
    }
  };
};

export interface Output {
  code: number;
  stdout: string;
  stderr: string;
}

export interface TestResult {
  passed: boolean;
  testOutput: Output;
  previewOutput: Output;
}

/**
 * Format preview and test result output into a standardized response.
 */
export const createTestResult = (
  previewOutput: ShellString,
  testOutput: ShellString,
  testResultsFilePath: string
): TestResult => {
  let passed = false;
  if (testOutput.code !== 0) {
    passed = false;
  } else {
    const testResult = fs.readFileSync(testResultsFilePath, {
      encoding: "utf-8",
    });
    passed = testResult === "true" ? true : false;
  }

  return {
    passed,
    testOutput: {
      code: testOutput.code,
      stdout: testOutput.stdout,
      stderr: testOutput.stderr,
    },
    previewOutput: {
      code: previewOutput.code,
      stdout: previewOutput.stdout,
      stderr: previewOutput.stderr,
    },
  };
};
