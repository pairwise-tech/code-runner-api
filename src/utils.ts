import { exec } from "shelljs";
import fs from "fs";
import rimraf from "rimraf";
import shortid from "shortid";
import hashes from "jshashes";
import { LocalStorage } from "node-localstorage";
import { ChildProcess } from "child_process";

/** ===========================================================================
 * Shared Utils
 * ============================================================================
 */

/**
 * Artificially wait the provided amount of time.
 */
export const wait = async (time = 1000) => {
  await new Promise((_: any) => setTimeout(_, time));
};

export interface ShellOutput {
  code: number;
  stdout: string;
  stderr: string;
}

export interface TestResult {
  passed: boolean;
  testOutput: ShellOutput;
  previewOutput: ShellOutput;
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
 * compute time and overhead. It uses node-localstorage to cache results
 * on disk on a local temporary file. This is fast and helps for local
 * development.
 *
 * This could be moved to a persistent cache layer, e.g. Redis, in
 * production.
 */
class GlobalCodeCacheClass {
  store = new LocalStorage("./challenge-results-cache");

  get(hash: string): TestResult | null {
    const result = this.store.getItem(hash);
    if (result === null) {
      return null;
    }

    try {
      return JSON.parse(result);
    } catch (err) {
      console.log("Error parsing cached result: ", err);
      return null;
    }
  }

  set(hash: string, result: TestResult) {
    this.store.setItem(hash, JSON.stringify(result));
  }
}

const globalCodeCache = new GlobalCodeCacheClass();

/**
 * Hash the code string + test string to create a unique key which can
 * identify this challenge attempt.
 */
const getCodeStringHash = (codeString: string, testString: string) => {
  const code = codeString + testString;
  return new hashes.SHA256().b64(code);
};

// May contain useful data later... e.g. deps/libs to load for a challenge
type TestExecutorMeta = any;

export type TestExecutor = (
  directoryId: string,
  codeString: string,
  testString: string,
  isUnitTestChallenge: boolean,
  meta?: TestExecutorMeta
) => Promise<TestResult>;

/**
 * Wrap the code execution runner in a try catch statement and provide
 * caching support to minimize compute time.
 */
export const tryCatchCodeExecution = (testFn: TestExecutor) => {
  return async (
    language: SupportedLanguage,
    codeString: string,
    testString: string,
    isUnitTestChallenge = false
  ): Promise<TestResult> => {
    try {
      const codeHash = getCodeStringHash(codeString, testString);
      const maybeCachedResult = globalCodeCache.get(codeHash);

      // Return cached result if it exists
      if (maybeCachedResult !== null) {
        console.log(
          `- [CACHE]: Returning cached result for ${language} challenge.`
        );
        return maybeCachedResult;
      }

      // Create a unique id for a folder for this challenge execution to
      // occur in. This will be created and then destroyed after the tests
      // are complete.
      const id = shortid.generate();
      const dir = `./temp/${language}/${id}`;

      // Create the unique temporary challenge directory
      // Because Rust challenges are run in parallel, there are two separate
      // directories.
      fs.mkdirSync(`${dir}_1`);
      fs.mkdirSync(`${dir}_2`);

      // Execute the code
      const result = await testFn(
        id,
        codeString,
        testString,
        isUnitTestChallenge
      );

      // Remove the unique temporary challenge directory and all contents
      rimraf.sync(`${dir}_1`);
      rimraf.sync(`${dir}_2`);

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
  previewOutput: ShellOutput,
  testOutput: ShellOutput,
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

interface CodeExecutionResult {
  testResult: ShellOutput;
  previewResult: ShellOutput;
}

/**
 * SPECIAL NOTE: To safeguard against user's running infinitely looping
 * code, we execute their code against a timeout. If the timeout is reached
 * we want to abort the code execution. This means we need to kill the process
 * running their code.
 *
 * I found that the pid of the ChildProcess returned from shelljs was not
 * the actual pid of the process running cargo for compiling Rust code, in
 * Rust challenges. It seemed another process was started just after the
 * first. Therefore, the logic here kills the current process AND the next
 * process, next = next numerically by pid. It also slightly delays the
 * parallel execution of the second promise in the below function to ensure
 * the 'next' pid of the first process is into the cargo sub-process.
 *
 * Really feels sketchy and quite dangerous but it seems work...
 *
 * Grepping for cargo related processes would have the risk of aborting
 * extraneous other processes which are simultaneously running but not
 * related to the current challenge.
 *
 * Ideally, there is a way to definitely know any/all subprocess pids
 * of the ChildProcess and abort them directly that way.
 *
 * This should be adapted and used for other language types as well. For now
 * this is only test on Rust challenges.
 */
export const handleGuardedCodeExecutionForRustChallenges = async (
  testRunCommand: string,
  previewCommand: string,
  isUnitTestChallenge: boolean
): Promise<CodeExecutionResult> => {
  // Run in parallel, with a slightly delay for the second...
  const [testResult, previewResult] = await Promise.all([
    guardedCodeExecutioner(testRunCommand, isUnitTestChallenge),
    guardedCodeExecutioner(previewCommand, isUnitTestChallenge, true),
  ]);

  return {
    testResult,
    previewResult,
  };
};

// Kill a process... and next process numerically based on pid...
// See the SPECIAL NOTE above...
const handleKillProcesses = (process: ChildProcess) => {
  if (process.killed) {
    return;
  }

  let id = process.pid;
  console.log(`Timeout exceeded, killing process pid: ${process.pid}`);

  // Kill the given process
  exec(`kill ${id}`);
  console.log(`Process ${id} killed.`);

  // Increment next id and check the process:
  id++;
  const result = exec(`ps ${id}`);

  // If it looks like a cargo process, kill it too...
  if (result.stdout.includes("cargo")) {
    console.log(`Cargo process found... killing it as well, pid: ${id}`);
    exec(`kill ${id}`);
  }
};

// Should be long enough
const TWELVE_SECONDS = 12000;

/**
 * Run a code execution command against a timeout limit to guard against
 * infinite loops in user code. Fail if the timeout is exceeded and
 * kill the process which is running the code execution.
 */
export const guardedCodeExecutioner = async (
  command: string,
  isUnitTestChallenge: boolean,
  enableSketchyAntiRaceConditionSmallDelay = false
): Promise<ShellOutput> => {
  let processExited = false;

  return new Promise(async (resolve) => {
    const onExit = (code: number, stdout: string, stderr: string) => {
      processExited = true;

      /**
       * If there is a compiler error the stdout will be empty. This is
       * relevant when processing the unit test challenges, because we
       * want to surface the stderr compiler output in that case.
       */
      const isCompileError = code !== 0 && stdout === "";

      /**
       * When running cargo test, if the tests fail the relevant output
       * is printed to stdout. We want to surface this to the user, but
       * the tests failed so the app is looking for error output in the stderr
       * field. Swap the fields here if the it is a unit test challenge and
       * a non zero exit code.
       */
      const isCargoTestFailure = code !== 0 && !isCompileError;

      if (isUnitTestChallenge && isCargoTestFailure) {
        resolve({ code, stderr: stdout, stdout: stderr });
      } else {
        resolve({ code, stdout, stderr });
      }
    };

    // See SPECIAL NOTE above
    if (enableSketchyAntiRaceConditionSmallDelay) {
      await wait(250);
    }

    // Start command execution
    const process: ChildProcess = exec(command, onExit);
    console.log(`Process started, pid: ${process.pid}`);

    // Fallback wait on timeout...
    // If this time limit is reached and the code has not finished running,
    // kill the process and return a failure status. We assume the code
    // should finish execution in this window, otherwise there may be
    // infinite loops in the code which we are not interested in running
    // on this server.
    await wait(TWELVE_SECONDS);

    // Nothing to do here, code completed normally.
    if (processExited) {
      return;
    }

    // Timeout reached, kill code execution processes
    handleKillProcesses(process);

    resolve({
      code: 1,
      stdout: "",
      stderr:
        "Code execution failed to complete within time limit and was aborted. Please check your code for any infinite loops.",
    });
  });
};
