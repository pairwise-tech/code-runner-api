import getenv from "getenv";
import dotenv from "dotenv";
dotenv.config();

export const USE_CHALLENGE_CACHE = getenv.bool("USE_CHALLENGE_CACHE", false);
