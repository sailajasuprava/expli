import { authenticate } from "../shopify.server";
import prisma from "../db.server"; // not named import

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);

    if (!session) {
      throw new Error("No admin session");
    }

    const shop = session.shop;
    const body = await request.json();

    await prisma.bookingConfig.upsert({
      where: { shop },
      update: {
        durationHours: body.durationHours,
        durationMinutes: body.durationMinutes,
        incrementValue: body.incrementValue,
        incrementUnit: body.incrementUnit,
      },
      create: {
        shop,
        durationHours: body.durationHours,
        durationMinutes: body.durationMinutes,
        incrementValue: body.incrementValue,
        incrementUnit: body.incrementUnit,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("BOOKING CONFIG SAVE ERROR:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
