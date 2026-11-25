// URL of the public marketing website (fastcase-website).
// - Set NEXT_PUBLIC_WEBSITE_URL to override.
// - In local development it defaults to the Vite dev server, so "Website" links never open the live site.
export const WEBSITE_URL: string =
  process.env.NEXT_PUBLIC_WEBSITE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://fastcase.in");
