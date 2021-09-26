import pythonCodeRunner from "../python-code-runner";

const PYTHON_CODE_STRING_VALID = `
# Write your code here
# This function concatenates an arbitrary number of input strings
def concatenate(*strings):
  result = ""
  for x in strings:
    result += x
  return result
`;

const PYTHON_CODE_STRING_INVALID = `
# Write your code here
# This function concatenates an arbitrary number of input strings
def concatenate(*strings):
  result = ""
  return result
`;

const PYTHON_TEST_STRING = `
def test():
  result = concatenate("a", "b", "c")
  expected = "abc"
  if result != expected:
    return False

  result = concatenate("hi", "hi", "blegh", "hi")
  expected = "hihibleghhi"
  if result != expected:
    return False

  result = concatenate("apple", "banana", "strawberry")
  expected = "applebananastrawberry"
  if result != expected:
    return False

  result = concatenate("cake", "brownie")
  expected = "cakebrownie"
  if result != expected:
    return False

  result = concatenate("chair", "table", "fred", "a", "b", "c", "d", "e")
  expected = "chairtablefredabcde"
  if result != expected:
    return False

  result = concatenate()
  expected = ""
  if result != expected:
    return False

  return True
`;

describe("Python test runner works correctly.", () => {
  test("Python test runner evaluates challenges correctly.", async () => {
    let result = await pythonCodeRunner(
      "python",
      PYTHON_CODE_STRING_INVALID,
      PYTHON_TEST_STRING
    );

    expect(result.passed).toBe(false);

    result = await pythonCodeRunner(
      "python",
      PYTHON_CODE_STRING_VALID,
      PYTHON_TEST_STRING
    );

    expect(result.passed).toBe(true);
  });
});
