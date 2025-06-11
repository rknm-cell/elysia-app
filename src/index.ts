import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { bearer } from "@elysiajs/bearer";
import { cookie } from "@elysiajs/cookie";

const users: User[] = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "admin",
    secret: "admin-secret-123",
  },
  {
    id: 2,
    username: "user",
    password: "user123",
    role: "basic",
    secret: "user-secret-456",
  },
];

const userBody = t.Object({
  id: t.Number(),
  username: t.String(),
  password: t.String(),
  role: t.String(),
  secret: t.String(),
});
type User = typeof userBody.static;

export const addressController = new Elysia({
  prefix: "/jwt",
  detail: {
    tags: ["jwt"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
});

const app = new Elysia({ cookie: { secrets: "secret" } });

app.get("/", () => "Hi");

app
  .use(cookie())
  .get("/cookie", ({ cookie }) => {
    cookie.username.set({
      value: "admin",
      maxAge: 60 * 60,
      path: "/",
      httpOnly: false,
      secure: false,
    });

    return { cookie };
  })
  .use(
    swagger({
      path: "/api-docs",
      documentation: {
        info: {
          title: "Elysia Server App Documentation",
          version: "1.0.0",
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
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
    .use(bearer())
    .get("/bearer", ({ bearer }) => bearer, {
      beforeHandle({ bearer, set, status }) {
        console.log(bearer);
        if (!bearer) {
          set.headers[
            "WWW-Authenticate"
          ] = `Bearer realm='sign', error="invalid_request"`;

          return status(400, "Unauthorized");
        }
      },
    })

    .post("/headers", (headers) => headers, {
      headers: t.Object({
        authorization: t.String(),
      }),
    })

    .get("/cookie", ({ cookie }) => cookie, {
      cookie: t.Cookie({
        cookieName: t.String(),
      }),
    })

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
