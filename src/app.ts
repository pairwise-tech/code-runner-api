import express, { Request, Response } from "express";
import cors from "cors";
import rustCodeRunner from "./rust-code-runner";

/** ===========================================================================
 * Setup Server
 * ============================================================================
 */

const app = express();

// Enable cors
app.use(cors());

// Enable parsing body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Index route.
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Pairwise Code Runner API is online 🎉");
});

/**
 * POST
 */
app.post("/api/rust", async (req: Request, res: Response) => {
  const { body } = req;
  const { codeString, testString } = body;
  const result = await rustCodeRunner(codeString, testString);
  console.log("RESULT:");
  console.log(result);
  res.json(result);
});

/** ===========================================================================
 * Run the Server
 * ============================================================================
 */

const PORT = process.env.PORT || 6001;

app.listen(PORT, () => {
  console.log(
    `Pairwise Code Runner API is running on http://localhost:${PORT}`
  );
});
