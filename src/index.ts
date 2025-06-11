import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";

const users: User[] = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "user", password: "user123", role: "basic" },
];

const userBody = t.Object({
  id: t.Number(),
  username: t.String(),
  password: t.String(),
  role: t.String(),
});
type User = typeof userBody.static;

const AuthModel = new Elysia().model({});

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
    .model({
      user: t.Object({
        username: t.String(),
        password: t.String(),
        role: t.String(),
      }),
    })
    // public route
    .get("/public", { message: "This is public information" })
    // private route
    .get(
      "/private",
      ({ body: { username, password } }) => ({ username, password }),
      {
        body: t.Object({
          username: t.String(),
          password: t.String(),
        }),
      }
    )

    .post(
      "/protected_route",
      ({ body: { username, password } }) => {
        const user = users.find((user) => user.username === username);

        if (user && user.role === "admin") {
          return { message: "Access granted" };
        }
        return { message: "Access denied" };
      },
      {
        body: t.Object({
          username: t.String(),
          password: t.String(),
        }),
      }
    )
);

app.listen(3000);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
