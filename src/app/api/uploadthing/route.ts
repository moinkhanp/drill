import { createNextRouteHandler } from "uploadthing/next";
 
import { ourFileRouter } from "./core";

export const runtime = "nodejs";

 
// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter,
  config: {
    callbackUrl: "https://drillfile.vercel.app/api/uploadthing", // Force production URL
  },
});