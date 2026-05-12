import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/trpc";
import { httpLink } from "@trpc/client";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";

  if (process.env.VERCEL_URL)
    return `https://${process.env.NEXT_PUBLIC_APP_VERCEL_URL}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
});
