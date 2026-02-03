import prisma from "../db.server";

export async function loader({ request }) {
  // Add CORS headers for Shopify storefronts
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return Response.json(null, { headers: corsHeaders });
  }

  const config = await prisma.bookingConfig.findUnique({
    where: { shop },
  });

  return Response.json(config, { headers: corsHeaders });
}
