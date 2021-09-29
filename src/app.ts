import express, { Request, Response } from "express";
import cors from "cors";
import rustCodeRunner from "./rust-code-runner";
import pythonCodeRunner from "./python-code-runner";
import golangCodeRunner from "./golang-code-runner";
import { initializeTempDirectory } from "./utils";

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

(async () => {
  await initializeTempDirectory();

  app.listen(PORT, () => {
    console.log(
      `\n - Pairwise Code Runner API is running on http://localhost:${PORT}`
    );
  });
})();
