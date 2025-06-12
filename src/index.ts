import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { bearer } from "@elysiajs/bearer";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";

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
  .use(bearer())
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
          description: "Elysiajs API test for authentication and authorization",
        },
        servers: [
          { url: "http://localhost:3000", description: "Development server" },
        ],
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
    .use(
      jwt({
        name: "jwt",
        secret: "Awww come on man",
      })
    )
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
    .derive(({ headers }) => {
      const auth = headers["authorization"];
      return {
        bearer: auth?.startsWith("Bearer ") ? auth.slice(7) : null,
      };
    })
    .get("/verify-secret", ({ bearer, set }) => {
      if (!bearer) {
        set.status = 401;
        return { error: "Bearer token required" };
      }

      // Find user by secret
      const user = users.find((u) => u.secret === bearer);

      if (!user) {
        set.status = 401;
        return { error: "Invalid token" };
      }

      return {
        message: "Token valid",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
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
    .get("/jwt/:name", async ({ jwt, params: { name }, cookie: { auth } }) => {
      const value = await jwt.sign({ name });

      auth.set({
        value,
        httpOnly: true,
        maxAge: 60 * 60,
        path: "/profile",
      });
      return `Sign in as ${value}`;
    })
    .get("/profile", async ({ jwt, status, cookie: { auth } }) => {
      const profile = await jwt.verify(auth.value);

      if (!profile) return status(401, "Unauthorized");

      return `Hello ${profile.name}`;
    })
    .get('/cookie-check', ({cookie}) => {
      if(cookie.auth){
        return {authenticated: true, token: cookie};
      }
      return {authenticated: false};
    })
    
),
  { detail: { summary: "Protected Route" } };

app.listen(3000);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
