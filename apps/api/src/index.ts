import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { languagesRoute } from "./routes/languages";
import { storiesRoute } from "./routes/stories";
import { progressRoute } from "./routes/progress";
import { devUserMiddleware } from "./middleware/devUser";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use(
  "/api/*",
  cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173" }),
);

app.route("/api/languages", languagesRoute);

// Everything below acts on a user. Real sessions land in the Auth slice;
// devUserMiddleware is the only thing that changes then.
app.use("/api/stories/*", devUserMiddleware);
app.use("/api/progress/*", devUserMiddleware);
app.route("/api/stories", storiesRoute);
app.route("/api/progress", progressRoute);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Weave API listening on http://localhost:${info.port}`);
});
