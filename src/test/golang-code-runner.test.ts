import golangCodeRunner from "../golang-code-runner";

const GOLANG_CODE_STRING_VALID = `
// Write your code here
func filterMatrix(matrix [][]int, target int) [][]int {
  var filtered [][]int

  // Build a new matrix excluding all target elements
  for y := 0; y < len(matrix); y++ {
    filtered = append(filtered, []int{})
    for x := 0; x < len(matrix[y]); x++ {
      item := matrix[y][x]
      if item != target {
        filtered[y] = append(filtered[y], item)
      }
    }
  }

  var result [][]int

  // Remove empty rows
  for i := 0; i < len(filtered); i++ {
    row := filtered[i]
    if len(row) > 0 {
      result = append(result, row)
    }
  }

  return result
}`;

const GOLANG_CODE_STRING_INVALID = `
// Write your code here
func filterMatrix(matrix [][]int, target int) [][]int {
  return matrix
}`;

const GOLANG_TEST_STRING = `
func compareMatrix(a [][]int, b [][]int) bool {
  for y := 0; y < len(a); y++ {
    for x := 0; x < len(a[y]); x++ {
      if a[y][x] != b[y][x] {
        return false
      }
    }
  }

  return true
}

func test() bool {
  var matrix = [][]int{
    {1,2,3},
    {5,5,5},
    {4,5,6},
    {5,5,7},
    {5,5,5},
  }
  var expected = [][]int{
    {1,2,3},
    {4,6},
    {7},
  }
  var result = filterMatrix(matrix, 5)
  var equal = compareMatrix(result, expected)
  if equal != true {
    return false
  }

  matrix = [][]int{
    {1,2,3},
    {5,5,5},
    {4,5,6},
    {5,5,7},
    {5,5,5},
  }
  expected = [][]int{
    {1,2,3},
    {5,5,5},
    {4,5,6},
    {5,5,7},
    {5,5,5},
  }
  result = filterMatrix(matrix, 50)
  equal = compareMatrix(result, expected)
  if equal != true {
    return false
  }

  matrix = [][]int{
    {1,2,3},
    {5,5,5},
    {4,5,6},
    {5,5,7},
    {5,5,5},
  }
  expected = [][]int{
    {1,2,3},
    {5,5,5},
    {4,5,6},
    {5,5},
    {5,5,5},
  }
  result = filterMatrix(matrix, 7)
  equal = compareMatrix(result, expected)
  if equal != true {
    return false
  }

  matrix = [][]int{{}}
  expected = [][]int{{}}
  result = filterMatrix(matrix, 50)
  equal = compareMatrix(result, expected)
  if equal != true {
    return false
  }

  matrix = [][]int{
    {1,1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1,1},
  }
  expected = [][]int{{}}
  result = filterMatrix(matrix, 1)
  equal = compareMatrix(result, expected)
  if equal != true {
    return false
  }

  matrix = [][]int{
    {1,1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1,1},
    {1,1,1,1,100,1,1,1,1},
    {1,1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1,1},
  }
  expected = [][]int{
    {100},
  }
  result = filterMatrix(matrix, 1)
  equal = compareMatrix(result, expected)
  if equal != true {
    return false
  }

  return true
}`;

describe("Golang test runner works correctly.", () => {
  test("Golang test runner evaluates challenges correctly.", async () => {
    let result = await golangCodeRunner(
      "golang",
      GOLANG_CODE_STRING_INVALID,
      GOLANG_TEST_STRING
    );

    expect(result.passed).toBe(false);

    result = await golangCodeRunner(
      "golang",
      GOLANG_CODE_STRING_VALID,
      GOLANG_TEST_STRING
    );

    expect(result.passed).toBe(true);
  });
});
