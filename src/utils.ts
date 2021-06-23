import fs from "fs";
import { ShellString } from "shelljs";

/** ===========================================================================
 * Shared Utils
 * ============================================================================
 */

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

export const tryCatchCodeExecution = (
  testFn: (codeString: string, testString: string) => Promise<TestResult>
) => {
  return (codeString: string, testString: string) => {
    try {
      return testFn(codeString, testString);
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
