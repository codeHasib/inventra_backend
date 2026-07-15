import { app } from "../src/app";
import { connectDatabase } from "../src/config/db";

connectDatabase().catch(console.error);

export default app;
