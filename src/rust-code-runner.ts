import fs from "fs";
import { exec } from "shelljs";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const RUST_DIRECTORY = "./temp/rust-test-folder";
const TEST_FILE_PATH = `${RUST_DIRECTORY}/src/main.rs`;
const PREVIEW_FILE_PATH= `${RUST_DIRECTORY}/src/main.rs`;
const TEST_RESULTS_FILE_NAME = `test-results.txt`;
const TEST_RESULTS_FILE_PATH = `${RUST_DIRECTORY}/${TEST_RESULTS_FILE_NAME}`;

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

/** ===========================================================================
 * Main Function
 * ----------------------------------------------------------------------------
 * This takes a user code string and test code string, sandwiches them between
 * the prelude and postlude defined above and then compiles them with Cargo,
 * returning the results to the client.
 * ============================================================================
 */

const compileAndRun = async (
  codeString: string,
  testString: string
) => {
  // Create Cargo Package if it doesn't exist
  if (!fs.existsSync(RUST_DIRECTORY)) {
    exec(
      `cargo init ${RUST_DIRECTORY}`,
      (code: number, stdout: string, stderr: string) => {
        console.log("Exit code:", code);
        console.log("Program output:", stdout);
        console.log("Program stderr:", stderr);
      }
    );
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
  const PREVIEW_RUN_COMMAND = `cd ${RUST_DIRECTORY} && cargo run`;
  const previewResult = await exec(PREVIEW_RUN_COMMAND);
  const { stdout, stderr } = previewResult;

  // Run test file
  fs.writeFileSync(TEST_RESULTS_FILE_PATH, "");
  fs.writeFileSync(TEST_FILE_PATH, TEST_FILE);
  const TEST_RUN_COMMAND = `cd ${RUST_DIRECTORY} && cargo run`;
  const result = await exec(TEST_RUN_COMMAND);
  const { code } = result;

  // Any non 0 code represents a failure
  if (code !== 0) {
    return {
      stdout,
      stderr,
      testResult: false,
    };
  }

  const testResult = fs.readFileSync(TEST_RESULTS_FILE_PATH, { encoding: "utf-8" });

  return {
    stdout,
    stderr,
    testResult,
  };
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default async (codeString: string, testString: string) => {
  try {
    return compileAndRun(codeString, testString);
  } catch (err) {
    return {
      testResult: false,
      stdout: "",
      stderr: "An error occurred attempting to evaluate the challenge.",
    };
  }
}
