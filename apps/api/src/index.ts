import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { languagesRoute } from "./routes/languages";
import { storiesRoute } from "./routes/stories";
import { progressRoute } from "./routes/progress";
import { authRoute } from "./routes/auth";
import { requireSession } from "./middleware/requireSession";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use(
  "/api/*",
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);

app.route("/api/languages", languagesRoute);
app.route("/api/auth", authRoute);

// Everything below requires a real session (SPEC §7.3/§7.4).
app.use("/api/stories/*", requireSession);
app.use("/api/progress/*", requireSession);
app.route("/api/stories", storiesRoute);
app.route("/api/progress", progressRoute);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Weave API listening on http://localhost:${info.port}`);
});
