import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const event = JSON.parse(formData.get("event"));

  await db.event.create({
    data: {
      shop: session.shop,
      name: event.name,
      duration: Number(event.duration),
      maxAttendees: Number(event.maxAttendees),
      productId: event.productId,
      schedule: event.schedule,
    },
  });

  return Response.json({ success: true });
}
