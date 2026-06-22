import { withAuth } from "next-auth/middleware";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      if (!token) return false;
      const sub = typeof token.sub === "string" ? token.sub.trim() : "";
      const email =
        typeof token.email === "string" ? token.email.trim() : "";
      return UUID_RE.test(sub) && EMAIL_RE.test(email);
    },
  },
});

export const config = {
  matcher: ["/mycelia", "/mycelia/:path*"],
};
