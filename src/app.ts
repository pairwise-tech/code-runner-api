import fs from "fs";
import { exec } from "shelljs";
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";

/** ===========================================================================
 * Setup Server
 * ============================================================================
 */

const app = express();

// Enable cors
app.use(cors());

// Enable parsing body
app.use(bodyParser.json());

/**
 * Index route.
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Pairwise Code Runner API is online 🎉");
});

/**
 * POST
 */
app.post("/api", (req: Request, res: Response) => {
  const { body } = req;
  const response = {
    requestBody: body,
    message: "Got a POST request at /api 🎉",
  };
  res.json(response);
});

const RUST_FILE = "";

const version = exec("node --version", { silent: true }).stdout;

const child = exec("ls", { async: true });
if (child.stdout) {
  child.stdout.on("data", function (data: any) {
    /* ... do something with data ... */
  });
}

exec("rustup -v", function (code: any, stdout: any, stderr: any) {
  console.log("Exit code:", code);
  console.log("Program output:", stdout);
  console.log("Program stderr:", stderr);
});

/** ===========================================================================
 * Run the Server
 * ============================================================================
 */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Pairwise HTTP API is running on http://localhost:${PORT}`);
});
