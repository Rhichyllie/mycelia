import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => Boolean(token?.sub && token?.email),
  },
});

export const config = {
  matcher: ["/mycelia", "/mycelia/:path*"],
};
