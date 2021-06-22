import fs from "fs";
import express, { Request, Response } from "express";
import cors from "cors";
import rustCodeRunner from "./rust-code-runner";
import pythonCodeRunner from "./python-code-runner";

// Create temp directory which will store temporary code output files
const TEMP_DIRECTORY = "temp";
if (!fs.existsSync(TEMP_DIRECTORY)) {
  fs.mkdirSync(TEMP_DIRECTORY);
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
  const result = await rustCodeRunner(codeString, testString);
  res.json(result);
});

/**
 * POST route to handle executing Python code.
 */
app.post("/api/python", async (req: Request, res: Response) => {
  const { codeString, testString } = req.body;
  const result = await pythonCodeRunner(codeString, testString);
  res.json(result);
});

/** ===========================================================================
 * Run the Server
 * ============================================================================
 */

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `Pairwise Code Runner API is running on http://localhost:${PORT}`
  );
});
