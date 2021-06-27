import fs from "fs";
import { ShellString } from "shelljs";

/** ===========================================================================
 * Shared Utils
 * ============================================================================
 */

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

const defaultFailureResult: TestResult = {
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

/**
 * A global cache used to memoize code -> result combinations to reduce
 * compute time and overhead.
 */
const globalCodeCache: Map<string, TestResult> = new Map();

const removeWhitespace = (x: string) => x.replace(/ /gi, "");

/**
 * Create a unique code key by stringify-ing the code and the strings and
 * removing all whitespace. This will result in long object key strings,
 * but it turns out the size limit for keys is very large, potentially
 * up to the maximum size for a string.
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
  return async (
    codeString: string,
    testString: string
  ): Promise<TestResult> => {
    try {
      // First compute a key from the input code strings and check if this
      // combination has been tested previously and recorded in the cache
      const codeKey = createCodeKey(codeString, testString);
      const cachedResult = globalCodeCache.get(codeKey);
      if (cachedResult !== undefined) {
        return cachedResult;
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

/**
 * Format preview and test result output into a standardized response.
 */
export const createTestResult = (
  previewOutput: ShellString,
  testOutput: ShellString,
  testResultsFilePath: string
): TestResult => {
  let passed = false;

  // Non-zero exit codes represent some failure
  if (testOutput.code !== 0) {
    passed = false;
  } else {
    // If exit code is 0, read the test result from the output file
    // If should be a simple string: "true" or "false".
    const testResult = fs.readFileSync(testResultsFilePath, {
      encoding: "utf-8",
    });
    passed = testResult === "true" ? true : false;
  }

  const result: TestResult = {
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

  return result;
};
