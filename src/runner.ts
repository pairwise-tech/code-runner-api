import fs from "fs";
import { exec } from "shelljs";

const log = (message: string) => console.log(`- [LOG]: ${message}`);

const PRELUDE = `
  use std::fs::File;
  use std::io::prelude::*;
`;

const RUST_CODE_STRING = `
  fn add(a: i32, b: i32) -> i32 {
    a + b
  }
`;

const RUST_TEST_STRING = `
  fn test<'a>() -> bool {
    let mut result = add(10, 5);
    let mut expected = 15;
    if result != expected {
        return false;
    }

    result = add(100, 200);
    expected = 300;
    if result != expected {
        return false;
    }

    result = add(10, 25);
    expected = 35;
    if result != expected {
        return false;
    }

    result = add(-15, 15);
    expected = 0;
    if result != expected {
        return false;
    }

    result = add(1000, -2000);
    expected = -1000;
    if result != expected {
        return false;
    }

    true
  }
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

    let mut file = File::create("test-results.txt")?;
    file.write(result_string.as_bytes())?;
    Ok(())
  }
`;

const compileAndRunRustCode = async (
  codeString: string,
  testString: string
) => {
  const RUST_DIRECTORY = "./cargo-package-folder";
  const RUST_SOURCE_FILE = `${RUST_DIRECTORY}/src/main.rs`;

  // Create Cargo Package if it doesn't exist
  if (!fs.existsSync(RUST_DIRECTORY)) {
    log("Creating Rust Cargo Package directory.");
    exec(
      `cargo init ${RUST_DIRECTORY}`,
      (code: number, stdout: string, stderr: string) => {
        console.log("Exit code:", code);
        console.log("Program output:", stdout);
        console.log("Program stderr:", stderr);
      }
    );
  } else {
    log("Rust Cargo Package directory already exists.");
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

  console.log("Exit code:", code);
  console.log("Program output:", stdout);
  console.log("Program stderr:", stderr);

  const RESULT_FILE = `${RUST_DIRECTORY}/test-results.txt`;
  const testResult = fs.readFileSync(RESULT_FILE, { encoding: "utf-8" });
  console.log("RESULT:\n");
  console.log(testResult);
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default () => {
  compileAndRunRustCode(RUST_CODE_STRING, RUST_TEST_STRING);
};
