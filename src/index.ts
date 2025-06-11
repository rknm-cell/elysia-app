import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";

const users = [
    { id: 1, username: "admin", password: "admin123", role: "admin" },
    { id: 2, username: "user", password: "user123", role: "basic" }
  ];

const app = new Elysia();

app.get("/", () => "Hi");
app.use(
  swagger({
    path: "/api-docs",
    documentation: {
      info: {
        title: "Elysia Server App Documentation",
        version: "1.0.0",
      },
    },
  })
);

app.group("/api", (app) =>
  app
    .get("/public", { message: "This is public information" })
    .get("/private", { message: "This is a private route" })
);

app.listen(3000);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
