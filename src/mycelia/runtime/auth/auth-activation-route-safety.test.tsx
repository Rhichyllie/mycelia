import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  INVALID_LOGIN_MESSAGE,
  LoginForm,
} from "../../../../app/login/login-form";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function source(...segments: string[]): string {
  return readFileSync(repoPath(...segments), "utf8");
}

describe("ENGINE-2 auth activation route safety", () => {
  it("protects the MYCELIA product routes through NextAuth middleware only", () => {
    const middlewareSource = source("middleware.ts");

    expect(middlewareSource).toContain("withAuth");
    expect(middlewareSource).toContain('signIn: "/login"');
    expect(middlewareSource).toContain('matcher: ["/mycelia", "/mycelia/:path*"]');
    expect(middlewareSource).not.toContain("/api/:path*");
    expect(middlewareSource).not.toContain("/login/:path*");
  });

  it("leaves the login route and auth API outside the middleware matcher", () => {
    const middlewareSource = source("middleware.ts");

    expect(middlewareSource).toContain("/mycelia/:path*");
    expect(middlewareSource).not.toContain("/api/auth");
    expect(middlewareSource).not.toContain('"/"');
  });

  it("renders the login form fields and plain-language error copy", () => {
    const html = renderToStaticMarkup(
      createElement(LoginForm, {
        callbackUrl: "/mycelia",
        initialError: true,
      }),
    );

    expect(html).toContain("Email");
    expect(html).toContain('name="email"');
    expect(html).toContain("Password");
    expect(html).toContain('name="password"');
    expect(html).toContain(INVALID_LOGIN_MESSAGE);
    expect(html).not.toContain("CredentialsSignin");
  });

  it("submits through the credentials provider and returns to the Control Center", () => {
    const loginFormSource = source("app", "login", "login-form.tsx");
    const loginPageSource = source("app", "login", "page.tsx");

    expect(loginFormSource).toContain('signIn("credentials"');
    expect(loginFormSource).toContain("callbackUrl");
    expect(loginPageSource).toContain('return "/mycelia"');
  });
});
