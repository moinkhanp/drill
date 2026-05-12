import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server";
import { httpLink } from "@trpc/client";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";

  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
