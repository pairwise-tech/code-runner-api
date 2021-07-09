import fs from "fs";
import { exec } from "shelljs";
import { createTestResult, TestExecutor, tryCatchCodeExecution } from "./utils";

/** ===========================================================================
 * Main Function
 * ----------------------------------------------------------------------------
 * This takes a user code string and test code string, sandwiches them between
 * the prelude and postlude defined above and then runs them with Python.
 * ============================================================================
 */

const compileAndRun: TestExecutor = async (
  directoryId,
  codeString,
  testString
) => {
  const PYTHON_DIRECTORY = `./temp/python/${directoryId}`;
  const TEST_FILE_PATH = `${PYTHON_DIRECTORY}/test.py`;
  const PREVIEW_FILE_PATH = `${PYTHON_DIRECTORY}/main.py`;
  const TEST_RESULTS_FILE_PATH = `${PYTHON_DIRECTORY}/test-results.txt`;

  // TODO: import requests to make http requests
  // e.g. import requests
  // Then pip install the module in the Docker image
  const PRELUDE = ``;

  const POSTLUDE = `
def main():
  result = test()
  resultString = ""
  if result:
    resultString = "true"
  else:
    resultString = "false"

  text_file = open("${TEST_RESULTS_FILE_PATH}", "w")
  n = text_file.write(resultString)
  text_file.close()

main()
  `;

  // Create Python temp directory
  if (!fs.existsSync(PYTHON_DIRECTORY)) {
    fs.mkdirSync(PYTHON_DIRECTORY);
  }

  // Build source file
  const TEST_FILE = `${PRELUDE}${codeString}${testString}${POSTLUDE}`;

  // This file runs the user's code in isolation and is used to return
  // standard output to render in the client preview panel
  const PREVIEW_FILE = `${PRELUDE}${codeString}`;

  // Create files for Python script and test results
  fs.writeFileSync(TEST_RESULTS_FILE_PATH, "");
  fs.writeFileSync(TEST_FILE_PATH, TEST_FILE);
  fs.writeFileSync(PREVIEW_FILE_PATH, PREVIEW_FILE);

  // Format Python files
  await exec(`autopep8 --in-place --aggressive --aggressive ${TEST_FILE}`);
  await exec(`autopep8 --in-place --aggressive --aggressive ${PREVIEW_FILE}`);

  // Run preview file
  const PREVIEW_RUN_COMMAND = `python3 ${PREVIEW_FILE_PATH}`;
  const previewResult = await exec(PREVIEW_RUN_COMMAND);

  // Run test file
  const TEST_RUN_COMMAND = `python3 ${TEST_FILE_PATH}`;
  const testResult = await exec(TEST_RUN_COMMAND);

  return createTestResult(previewResult, testResult, TEST_RESULTS_FILE_PATH);
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default tryCatchCodeExecution(compileAndRun);
