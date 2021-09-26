import { initializeTempDirectory } from "../utils";

// Extend test timeout
jest.setTimeout(30000);

// temp directory needs to exist
initializeTempDirectory();
