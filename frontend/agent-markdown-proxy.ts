import { next } from "@vercel/functions";

/**
 * Vercel Routing Middleware for the single content-negotiated public route.
 *
 * Static files take precedence over ordinary rewrites in this CRA deployment,
 * so a rewrite in vercel.json cannot replace the root index.html reliably.
 * Routing Middleware runs before the filesystem/cache and is intentionally
 * limited to `/` requests that explicitly prefer `text/markdown`.
 */
const BACKEND_ORIGIN = "https://alhrajplus.onrender.com";
const MARKDOWN_ACCEPT = /(?:^|[,\s])text\/markdown(?:\s*;|[,\s]|$)/i;

export const config = {
  matcher: "/",
};

export default async function agentMarkdownProxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const accept = request.headers.get("accept") || "";

  if (url.pathname !== "/" || !MARKDOWN_ACCEPT.test(accept)) {
    return next();
  }

  const upstream = await fetch(`${BACKEND_ORIGIN}/agent/home.md`, {
    headers: { Accept: "text/markdown" },
    redirect: "manual",
  });

  const headers = new Headers(upstream.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Vary", "Accept");
  headers.set("Cache-Control", "public, max-age=300");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
