import fs from "fs";
import { exec } from "shelljs";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const PYTHON_DIRECTORY = "./temp/python-test-folder";
const PYTHON_SOURCE_FILE = `${PYTHON_DIRECTORY}/main.py`;
const OUTPUT_FILE_NAME = "python-test-results.txt";
const TEST_RESULTS_FILE = `${PYTHON_DIRECTORY}/${OUTPUT_FILE_NAME}`;

const PRELUDE = ``;

const CODE_STRING = `
def add(a, b):
  return a + b
`;

const TEST_STRING = `
def test():
  result = add(10, 15)
  expected = (25)
  if result != expected:
      return False

  result = add(100, 150)
  expected = (250)
  if result != expected:
      return False

  result = add(-10, 10)
  expected = (0)
  if result != expected:
      return False

  result = add(1000, 5000)
  expected = (6000)
  if result != expected:
      return False

  result = add(250, -150)
  expected = (100)
  if result != expected:
      return False

  return True
`;

const POSTLUDE = `
def main():
  result = test()
  resultString = ""
  if result:
    resultString = "true"
  else:
    resultString = "false"

  text_file = open("${TEST_RESULTS_FILE}", "w")
  n = text_file.write(resultString)
  text_file.close()

main()
`;

/** ===========================================================================
 * Main Function
 * ----------------------------------------------------------------------------
 * This takes a user code string and test code string, sandwiches them between
 * the prelude and postlude defined above and then runs them with Python.
 * ============================================================================
 */

const compileAndRunRustCode = async (
  codeString: string,
  testString: string
) => {
  // Create Python temp directory
  if (!fs.existsSync(PYTHON_DIRECTORY)) {
    fs.mkdirSync(PYTHON_DIRECTORY);
  }

  // Build source file
  const PYTHON_FILE = `
    ${PRELUDE}
    ${codeString}
    ${testString}
    ${POSTLUDE}
  `;

  // Create files for Python script and test results
  fs.writeFileSync(PYTHON_SOURCE_FILE, PYTHON_FILE);
  fs.writeFileSync(TEST_RESULTS_FILE, "");

  // Format Python file
  const FORMAT_COMMAND = `autopep8 --in-place --aggressive --aggressive ${PYTHON_SOURCE_FILE}`;
  await exec(FORMAT_COMMAND);

  // Execute Python script using python3
  const PYTHON_RUN_COMMAND = `python3 ${PYTHON_SOURCE_FILE}`;
  const result = await exec(PYTHON_RUN_COMMAND);
  const { code, stdout, stderr } = result;

  if (code !== 0) {
    return {
      stdout,
      stderr,
      testResult: false,
    };
  }

  const testResult = fs.readFileSync(TEST_RESULTS_FILE, { encoding: "utf-8" });

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
