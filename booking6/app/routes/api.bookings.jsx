import { authenticate } from "../shopify.server";
import prisma from "../db.server"; // Prisma or DB client

export async function action({ request }) {
  const { session } = await authenticate.public(request);

  const body = await request.json();

  const booking = await prisma.booking.create({
    data: {
      shop: session.shop,
      productHandle: body.productHandle,
      date: body.date,
      timeRange: body.timeRange,
    },
  });

  return Response.json({ success: true, booking });
}
