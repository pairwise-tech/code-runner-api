import rustCodeRunner from "../rust-code-runner";

const RUST_CODE_STRING_VALID = `
// Here a simple string type is used to represent the error
// possibility of a Result type.
type NumberValidResult = Result<(), String>;

// Arbitrary check on a number input, which returns a Result type.
fn is_number_valid(num: i32) -> NumberValidResult {
  // Your code here
  if num < 25 {
    return Ok(())
  }

  return Err("Number is invalid".to_string())
}

// Function which inspects a Result type.
fn check_result(result: NumberValidResult) {
  println!("\nChecking Result: {:?}", result);

  // Idiomatic Rust match statement.
  match result {
    Ok(()) => println!("Result is valid"),
    Err(err) => println!("Result is invalid, error: {:?}", err),
  }
}

// Get a valid result:
let valid = is_number_valid(50);
check_result(valid);

// Get an invalid result:
let invalid = is_number_valid(5);
check_result(invalid);
`;

const RUST_CODE_STRING_INVALID = `
// Here a simple string type is used to represent the error
// possibility of a Result type.
type NumberValidResult = Result<(), String>;

// Arbitrary check on a number input, which returns a Result type.
fn is_number_valid(num: i32) -> NumberValidResult {
  // Your code here

  return Err("Number is invalid".to_string())
}

// Function which inspects a Result type.
fn check_result(result: NumberValidResult) {
  println!("\nChecking Result: {:?}", result);

  // Idiomatic Rust match statement.
  match result {
    Ok(()) => println!("Result is valid"),
    Err(err) => println!("Result is invalid, error: {:?}", err),
  }
}

// Get a valid result:
let valid = is_number_valid(50);
check_result(valid);

// Get an invalid result:
let invalid = is_number_valid(5);
check_result(invalid);
`;

const RUST_TEST_STRING = `
fn test() -> bool {
  let mut result = true;

  let mut fn_result = is_number_valid(5);
  match fn_result {
    Ok(()) => (),
    Err(e) => {
      result = false;
    }
  }

  fn_result = is_number_valid(50);
  match fn_result {
    Ok(()) => {
      result = false;
    },
    Err(e) => (),
  }

  return result;
}
`;

describe("Rust test runner works correctly.", () => {
  test("Rust test runner evaluates challenges correctly.", async () => {
    let result = await rustCodeRunner(
      "rust",
      RUST_CODE_STRING_INVALID,
      RUST_TEST_STRING
    );

    expect(result.passed).toBe(false);

    result = await rustCodeRunner(
      "rust",
      RUST_CODE_STRING_VALID,
      RUST_TEST_STRING
    );

    expect(result.passed).toBe(true);
  });
});
