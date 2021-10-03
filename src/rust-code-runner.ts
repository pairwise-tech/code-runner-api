import copy from "recursive-copy";
import fs from "fs";
import {
  createTestResult,
  handleGuardedCodeExecutionForRustChallenges,
  TestExecutor,
  tryCatchCodeExecution,
} from "./utils";

/** ===========================================================================
 * Main Function
 * ----------------------------------------------------------------------------
 * This takes a user code string and test code string, sandwiches them between
 * the prelude and postlude defined above and then compiles them with Cargo,
 * returning the results to the client.
 * ============================================================================
 */

const compileAndRun: TestExecutor = async (
  directoryId,
  codeString,
  testString
) => {
  const PACKAGE_NAME = "pairwise";
  const RUST_DIRECTORY_TEST = `./temp/rust/${directoryId}_1/${PACKAGE_NAME}`;
  const RUST_DIRECTORY_PREVIEW = `./temp/rust/${directoryId}_2/${PACKAGE_NAME}`;
  const TEST_FILE_PATH = `${RUST_DIRECTORY_TEST}/src/main.rs`;
  const PREVIEW_FILE_PATH = `${RUST_DIRECTORY_PREVIEW}/src/main.rs`;
  const TEST_RESULTS_FILE_NAME = `test-results.txt`;
  const TEST_RESULTS_FILE_PATH = `${RUST_DIRECTORY_TEST}/${TEST_RESULTS_FILE_NAME}`;

  /**
   * The prelude and postlude wrap the user's code in a main function. This
   * is intended to assist the user in allowing them to write arbitrary code
   * which can exist in the client and generate preview feedback. This is mainly
   * intended to provide a better user experience, but may easily be adjusted
   * in the future.
   */

  const PRELUDE = `
    use std::fs::File;
    use std::io::prelude::*;
  
    fn main() -> std::io::Result<()> {
  `;

  const POSTLUDE = `
      let result = test();
      let result_string: &str;
      if result {
          result_string = "true";
      } else {
          result_string = "false";
      }
  
      let mut file = File::create("${TEST_RESULTS_FILE_NAME}")?;
      file.write(result_string.as_bytes())?;
      Ok(())
    }
  `;

  // Create test Cargo Package if it doesn't exist
  if (!fs.existsSync(RUST_DIRECTORY_TEST)) {
    const CARGO_PACKAGE_DIRECTORY = `./temp/rust/cargo-template`;
    await copy(CARGO_PACKAGE_DIRECTORY, RUST_DIRECTORY_TEST);
  }

  // Create preview Cargo Package if it doesn't exist
  if (!fs.existsSync(RUST_DIRECTORY_PREVIEW)) {
    const CARGO_PACKAGE_DIRECTORY = `./temp/rust/cargo-template`;
    await copy(CARGO_PACKAGE_DIRECTORY, RUST_DIRECTORY_PREVIEW);
  }

  // Build source file
  const TEST_FILE = `
    ${PRELUDE}
    ${codeString}
    ${testString}
    ${POSTLUDE}
  `;

  // This file runs the user's code in isolation and is used to return
  // standard output to render in the client preview panel
  const PREVIEW_FILE = `
    fn main() {
      ${codeString}
    }
  `;

  // Run preview file
  fs.writeFileSync(PREVIEW_FILE_PATH, PREVIEW_FILE);

  // Run test file
  fs.writeFileSync(TEST_RESULTS_FILE_PATH, "");
  fs.writeFileSync(TEST_FILE_PATH, TEST_FILE);

  // Build shell commands
  const TEST_RUN_COMMAND = `cd ${RUST_DIRECTORY_TEST} && cargo run`;
  const PREVIEW_RUN_COMMAND = `cd ${RUST_DIRECTORY_PREVIEW} && cargo run`;

  // Execute the code
  const {
    testResult,
    previewResult,
  } = await handleGuardedCodeExecutionForRustChallenges(
    TEST_RUN_COMMAND,
    PREVIEW_RUN_COMMAND
  );

  return createTestResult(previewResult, testResult, TEST_RESULTS_FILE_PATH);
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default tryCatchCodeExecution(compileAndRun);
