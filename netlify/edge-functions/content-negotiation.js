/**
 * Content negotiation edge function.
 * Transparently serves index.md instead of index.html when the client
 * sends an Accept header that includes text/markdown.
 */
export default async (request, context) => {
    const accept = request.headers.get("accept") ?? "";
    if (!accept.includes("text/markdown")) {
        return context.next();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Skip requests that already have a file extension (assets, etc.)
    if (/\.[^/]+$/.test(path)) {
        return context.next();
    }

    url.pathname = (path.endsWith("/") ? path : path + "/") + "index.md";
    return context.rewrite(url.toString());
};

export const config = { path: "/*" };
