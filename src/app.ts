import express, { Request, Response } from "express";
import cors from "cors";
import rustCodeRunner from "./rust-code-runner";

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
  res.send("Pairwise Code Runner API is online 🎉");
});

/**
 * POST
 */
app.post("/api/rust", async (req: Request, res: Response) => {
  const { codeString, testString } = req.body;
  const result = await rustCodeRunner(codeString, testString);
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
