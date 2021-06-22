import fs from "fs";
import { exec } from "shelljs";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const RUST_DIRECTORY = "./temp/cargo-package-folder";
const RUST_SOURCE_FILE = `${RUST_DIRECTORY}/src/main.rs`;
const TEST_RESULTS_FILE = "rust-test-results.txt";

const PRELUDE = `
  use std::fs::File;
  use std::io::prelude::*;
`;

const POSTLUDE = `
  fn main() -> std::io::Result<()> {
    let result = test();
    let result_string: &str;
    if result {
        result_string = "true";
    } else {
        result_string = "false";
    }

    let mut file = File::create("${TEST_RESULTS_FILE}")?;
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

const compileAndRunRustCode = async (
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
  const RUST_FILE = `
    ${PRELUDE}
    ${codeString}
    ${testString}
    ${POSTLUDE}
  `;

  // Write source file to Cargo main/src.rs
  fs.writeFileSync(RUST_SOURCE_FILE, RUST_FILE);

  // Compile and run Rust file using Cargo
  const CARGO_RUN_COMMAND = `cd ${RUST_DIRECTORY} && cargo run`;
  const result = await exec(CARGO_RUN_COMMAND);
  const { code, stdout, stderr } = result;

  // Any non 0 code represents a failure
  if (code !== 0) {
    return {
      stdout,
      stderr,
      testResult: false,
    };
  }

  const RESULT_FILE = `${RUST_DIRECTORY}/${TEST_RESULTS_FILE}`;
  const testResult = fs.readFileSync(RESULT_FILE, { encoding: "utf-8" });

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

export default compileAndRunRustCode;
