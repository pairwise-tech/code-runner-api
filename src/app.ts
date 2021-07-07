import fs from "fs";
import express, { Request, Response } from "express";
import cors from "cors";
import rustCodeRunner from "./rust-code-runner";
import pythonCodeRunner from "./python-code-runner";
import golangCodeRunner from "./golang-code-runner";

export type SupportedLanguage = "python" | "golang" | "rust";

const TEMP_DIRECTORY = "temp";

if (!fs.existsSync(TEMP_DIRECTORY)) {
  console.log(`- [LOG]: ${TEMP_DIRECTORY} does not exist, creating it.`);
  fs.mkdirSync(TEMP_DIRECTORY);
}

const tempDirectories = [
  `${TEMP_DIRECTORY}/python`,
  `${TEMP_DIRECTORY}/rust`,
  `${TEMP_DIRECTORY}/golang`,
];

// Create a local temp directories for each language
for (const dir of tempDirectories) {
  if (!fs.existsSync(dir)) {
    console.log(`- [LOG]: ${dir} does not exist, creating it.`);
    fs.mkdirSync(dir);
  }
}

/** ===========================================================================
 * Setup Server
 * ============================================================================
 */

const app = express();

// Server config
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Index route.
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Pairwise Code Runner API is online 🤖");
});

/**
 * POST route to handle executing Rust code.
 */
app.post("/api/rust", async (req: Request, res: Response) => {
  const { codeString, testString } = req.body;
  const result = await rustCodeRunner("rust", codeString, testString);
  res.json(result);
});

/**
 * POST route to handle executing Python code.
 */
app.post("/api/python", async (req: Request, res: Response) => {
  const { codeString, testString } = req.body;
  const result = await pythonCodeRunner("python", codeString, testString);
  res.json(result);
});

/**
 * POST route to handle executing Golang code.
 */
app.post("/api/golang", async (req: Request, res: Response) => {
  const { codeString, testString } = req.body;
  const result = await golangCodeRunner("golang", codeString, testString);
  res.json(result);
});

/** ===========================================================================
 * Run the Server
 * ============================================================================
 */

// NOTE: Google App Engine flexible runtime requires exposing port 8080
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `Pairwise Code Runner API is running on http://localhost:${PORT}`
  );
});
