import { exec } from "shelljs";
import fs from "fs";
import rimraf from "rimraf";
import { ShellString } from "shelljs";
import shortid from "shortid";
import hashes from "jshashes";

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

/**
 * Hash the code string + test string to create a unique key which can
 * identify this challenge attempt.
 */
const getCodeStringHash = (codeString: string, testString: string) => {
  const code = codeString + testString;
  return new hashes.SHA256().b64(code);
};

export type TestExecutor = (
  directoryId: string,
  codeString: string,
  testString: string
) => Promise<TestResult>;

/**
 * Wrap the code execution runner in a try catch statement and provide
 * caching support to minimize compute time.
 */
export const tryCatchCodeExecution = (testFn: TestExecutor) => {
  return async (
    language: SupportedLanguage,
    codeString: string,
    testString: string
  ): Promise<TestResult> => {
    try {
      const codeHash = getCodeStringHash(codeString, testString);
      const maybeCachedResult = globalCodeCache.get(codeHash);
      if (maybeCachedResult !== undefined) {
        console.log(
          `- [LOG]: Returning cached result for ${language} challenge.`
        );
        return maybeCachedResult;
      }

      // Create a unique id for a folder for this challenge execution to
      // occur in. This will be created and then destroyed after the tests
      // are complete.
      const id = shortid.generate();
      const dir = `./temp/${language}/${id}`;

      // Create the unique temporary challenge directory
      fs.mkdirSync(dir);

      // Execute the code
      const result = await testFn(id, codeString, testString);

      // Remove the unique temporary challenge directory and all contents
      rimraf.sync(dir);

      // Cache the result
      globalCodeCache.set(codeHash, result);

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

export type SupportedLanguage = "python" | "golang" | "rust";

/**
 * Handle initialization of the temp directories.
 */
export const initializeTempDirectory = async () => {
  console.log("- [LOG]: Initializing temp directory.");

  const TEMP_DIRECTORY = "temp";

  if (!fs.existsSync(TEMP_DIRECTORY)) {
    console.log(`- [LOG]: ${TEMP_DIRECTORY} does not exist, creating it.`);
    fs.mkdirSync(TEMP_DIRECTORY);
  }

  const tempDirectories = [
    `${TEMP_DIRECTORY}/python`,
    `${TEMP_DIRECTORY}/rust`,
    `${TEMP_DIRECTORY}/golang`,
  ];

  // Create a local temp directories for each language
  for (const dir of tempDirectories) {
    if (!fs.existsSync(dir)) {
      console.log(`- [LOG]: ${dir} does not exist, creating it.`);
      fs.mkdirSync(dir);
    }
  }

  const CARGO_PACKAGE_DIRECTORY = `${TEMP_DIRECTORY}/rust/cargo-template`;

  if (!fs.existsSync(CARGO_PACKAGE_DIRECTORY)) {
    console.log(
      `- [LOG]: ${CARGO_PACKAGE_DIRECTORY} does not exist, creating it.`
    );
    await exec(`cargo init ${CARGO_PACKAGE_DIRECTORY}`);
  }
};
