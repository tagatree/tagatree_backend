import "dotenv/config";
import express from "express";
import cors from "cors";
import cycleRoutes from "./routes/cycle.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()),
}));

// Webhook must be mounted before express.json() to receive raw body
app.use("/webhooks", webhookRoutes);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to TagaTree API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/cycles", cycleRoutes);


app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
