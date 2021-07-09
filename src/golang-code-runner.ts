import fs from "fs";
import { exec } from "shelljs";
import {
  createTestResult,
  TestExecutor,
  TestResult,
  tryCatchCodeExecution,
} from "./utils";

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
): Promise<TestResult> => {
  const GOLANG_DIRECTORY = `./temp/golang/${directoryId}`;
  const TEST_FILE_PATH = `${GOLANG_DIRECTORY}/test.go`;
  const PREVIEW_FILE_PATH = `${GOLANG_DIRECTORY}/main.go`;
  const TEST_RESULTS_FILE_PATH = `${GOLANG_DIRECTORY}/test-results.txt`;

  const PRELUDE = `
  package main
  import (
    "os"
    "fmt"
    "strings"
  )
  
  // Hack to avoid compilation error from unused imports...
  var _ = os.Create
  var __ = fmt.Println
  var ___ = strings.ToUpper
  `;

  const POSTLUDE = `
  func main() {
    result := test()
    resultString := ""
    if result {
      resultString = "true"
    } else {
      resultString = "false"
    }
  
    // Write the result file
    f, err := os.Create("${TEST_RESULTS_FILE_PATH}")
    if err != nil {
      panic(err)
    }
  
    defer f.Close()
  
    _, err2 := f.WriteString(resultString)
  
    if err2 != nil {
      panic(err2)
    }
  }
  `;

  // Create Python temp directory
  if (!fs.existsSync(GOLANG_DIRECTORY)) {
    fs.mkdirSync(GOLANG_DIRECTORY);
  }

  // Build source file
  const TEST_FILE = `
    ${PRELUDE}
    ${stripMainFunctionIfExists(codeString)}
    ${testString}
    ${POSTLUDE}
  `;

  // This file runs the user's code in isolation and is used to return
  // standard output to render in the client preview panel
  const PREVIEW_FILE = `
    ${PRELUDE}
    ${formatPreviewCodeString(codeString)}
  `;

  // Create files for Python script and test results
  fs.writeFileSync(TEST_RESULTS_FILE_PATH, "");
  fs.writeFileSync(TEST_FILE_PATH, TEST_FILE);
  fs.writeFileSync(PREVIEW_FILE_PATH, PREVIEW_FILE);

  // Run preview file
  const PREVIEW_RUN_COMMAND = `go run ${PREVIEW_FILE_PATH}`;
  const previewResult = await exec(PREVIEW_RUN_COMMAND);

  // Run test file
  const TEST_RUN_COMMAND = `go run ${TEST_FILE_PATH}`;
  const testResult = await exec(TEST_RUN_COMMAND);

  return createTestResult(previewResult, testResult, TEST_RESULTS_FILE_PATH);
};

/** ===========================================================================
 * Utils
 * ============================================================================
 */

const MAIN_FUNC_SIGNATURE = "func main()";

/**
 * Helper function which strips out a main function, if it exists in
 * a code string, by matching the function signature and the {...}
 * brackets which define the function body.
 */
const stripMainFunctionIfExists = (codeString: string) => {
  if (codeString.includes(MAIN_FUNC_SIGNATURE)) {
    const startingIndex = codeString.indexOf(MAIN_FUNC_SIGNATURE);
    const firstBracket = startingIndex + MAIN_FUNC_SIGNATURE.length;
    let brackets = [];
    let finalIndex;

    for (let i = firstBracket; i < codeString.length; i++) {
      const character = codeString[i];
      if (character === "{") {
        brackets.push(character);
      } else if (character === "}") {
        brackets.pop();
        if (brackets.length === 0) {
          finalIndex = i + 1;
          break;
        }
      }
    }
    if (finalIndex) {
      return (
        codeString.substr(0, startingIndex) + codeString.substr(finalIndex)
      );
    }
  }

  // Apply no changes by default
  return codeString;
};

/**
 * Add placeholder main function to avoid compilation errors.
 */
const formatPreviewCodeString = (codeString: string) => {
  if (!codeString.includes(MAIN_FUNC_SIGNATURE)) {
    return `${codeString}\nfunc main() {}`;
  }

  return codeString;
};

/** ===========================================================================
 * Main Function
 * ----------------------------------------------------------------------------
 * This takes a user code string and test code string, sandwiches them between
 * the prelude and postlude defined above and then runs them with Golang.
 * ============================================================================
 */

const compileAndRun = async (
  codeString: string,
  testString: string
): Promise<TestResult> => {
  // Create Golang temp directory
  if (!fs.existsSync(GOLANG_DIRECTORY)) {
    fs.mkdirSync(GOLANG_DIRECTORY);
  }

  // Build source file
  const TEST_FILE = `
    ${PRELUDE}
    ${stripMainFunctionIfExists(codeString)}
    ${testString}
    ${POSTLUDE}
  `;

  // This file runs the user's code in isolation and is used to return
  // standard output to render in the client preview panel
  const PREVIEW_FILE = `
    ${PRELUDE}
    ${formatPreviewCodeString(codeString)}
  `;

  // Create files for Golang script and test results
  fs.writeFileSync(TEST_RESULTS_FILE_PATH, "");
  fs.writeFileSync(TEST_FILE_PATH, TEST_FILE);
  fs.writeFileSync(PREVIEW_FILE_PATH, PREVIEW_FILE);

  // Run preview file
  const PREVIEW_RUN_COMMAND = `go run ${PREVIEW_FILE_PATH}`;
  const previewResult = await exec(PREVIEW_RUN_COMMAND);

  // Run test file
  const TEST_RUN_COMMAND = `go run ${TEST_FILE_PATH}`;
  const testResult = await exec(TEST_RUN_COMMAND);

  return createTestResult(previewResult, testResult, TEST_RESULTS_FILE_PATH);
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default tryCatchCodeExecution(compileAndRun);
