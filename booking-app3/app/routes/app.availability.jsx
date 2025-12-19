import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Select,
  Button,
  InlineStack,
  BlockStack,
  Icon,
} from "@shopify/polaris";
import { PlusIcon, ClockIcon } from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import { useSubmit } from "react-router";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

import { Toast } from "@shopify/polaris";
import { useActionData } from "react-router";
import { useLoaderData } from "react-router";

/* ---------------- UI ---------------- */

const days = ["Mon", "Tue", "Wed"];

const INITIAL_EVENT_STATE = {
  name: "",
  duration: 30,
  maxAttendees: 1,
  productId: "",
  schedule: {
    Mon: [{ start: "09:00", end: "17:00" }],
    Tue: [{ start: "09:00", end: "17:00" }],
    Wed: [{ start: "09:00", end: "17:00" }],
  },
};

export default function AvailabilityPage() {
  const submit = useSubmit();
  const actionData = useActionData();
  const [toastActive, setToastActive] = useState(false);

  const { event: loadedEvent } = useLoaderData();

  const [event, setEvent] = useState(
    loadedEvent
      ? {
          id: loadedEvent.id,
          name: loadedEvent.name,
          duration: loadedEvent.duration,
          maxAttendees: loadedEvent.maxAttendees,
          productId: loadedEvent.productId ?? "",
          schedule: loadedEvent.schedule,
        }
      : INITIAL_EVENT_STATE,
  );

  useEffect(() => {
    if (actionData?.success) {
      setToastActive(true);

      // ✅ only reset when creating
      if (!event.id) {
        setEvent(INITIAL_EVENT_STATE);
      }
    }
  }, [actionData]);

  // in handleSave
  function handleSave() {
    const formData = new FormData();
    formData.append("intent", "save-event");

    if (event.id) {
      formData.append("eventId", event.id);
    }

    formData.append("event", JSON.stringify(event));
    submit(formData, { method: "post" });
  }

  function updateSchedule(day, field, value) {
    setEvent((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: [
          {
            ...prev.schedule[day][0],
            [field]: value,
          },
        ],
      },
    }));
  }

  const toastMarkup = toastActive ? (
    <Toast
      content="Event saved successfully"
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  return (
    <>
      {toastMarkup}
      <Page
        title="Setup Appointment Booking"
        primaryAction={{ content: "Continue", primary: true }}
        secondaryActions={[{ content: "Save changes", onAction: handleSave }]}
      >
        <Layout>
          {/* Configure Event */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Configure your event</Text>

                <TextField
                  label="Name"
                  value={event.name}
                  onChange={(value) =>
                    setEvent((prev) => ({ ...prev, name: value }))
                  }
                />

                <TextField
                  label="Duration"
                  type="number"
                  suffix="minutes"
                  value={String(event.duration)}
                  onChange={(value) =>
                    setEvent((prev) => ({
                      ...prev,
                      duration: Number(value),
                    }))
                  }
                />

                <TextField
                  label="Maximum Number of Attendees"
                  type="number"
                  value={String(event.maxAttendees)}
                  onChange={(value) =>
                    setEvent((prev) => ({
                      ...prev,
                      maxAttendees: Number(value),
                    }))
                  }
                />

                <Select
                  label="Linked Product"
                  options={[{ label: "Select a product", value: "" }]}
                  value={event.productId}
                  onChange={(value) =>
                    setEvent((prev) => ({ ...prev, productId: value }))
                  }
                />
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Weekly Schedule */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Weekly Schedule</Text>

                {days.map((day) => (
                  <InlineStack
                    key={day}
                    align="space-between"
                    blockAlign="center"
                    gap="300"
                  >
                    <Text fontWeight="medium">{day}</Text>

                    <InlineStack gap="200" blockAlign="center">
                      <TextField
                        value={event.schedule[day][0].start}
                        onChange={(value) =>
                          updateSchedule(day, "start", value)
                        }
                      />
                      <Text tone="subdued">to</Text>
                      <TextField
                        value={event.schedule[day][0].end}
                        onChange={(value) => updateSchedule(day, "end", value)}
                      />
                    </InlineStack>

                    <Button icon={PlusIcon} primary />
                    <Icon source={ClockIcon} />
                  </InlineStack>
                ))}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  if (!eventId) {
    return Response.json({ event: null });
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      shop: session.shop,
    },
  });

  return Response.json({ event });
}

/* ---------------- ACTION ---------------- */

// in action
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const intent = formData.get("intent");
  if (intent !== "save-event") {
    return Response.json({ ok: true });
  }

  const rawEvent = formData.get("event");
  const eventId = formData.get("eventId");

  if (!rawEvent || typeof rawEvent !== "string") {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  const event = JSON.parse(rawEvent);

  if (eventId) {
    // ✏️ UPDATE EXISTING EVENT
    await prisma.event.updateMany({
      where: {
        id: eventId,
        shop: session.shop,
      },
      data: {
        name: event.name,
        duration: Number(event.duration),
        maxAttendees: Number(event.maxAttendees),
        productId: event.productId || null,
        schedule: event.schedule,
      },
    });

    return Response.json({ success: true, mode: "updated" });
  }

  // ➕ CREATE NEW EVENT
  await prisma.event.create({
    data: {
      shop: session.shop,
      name: event.name,
      duration: Number(event.duration),
      maxAttendees: Number(event.maxAttendees),
      productId: event.productId || null,
      schedule: event.schedule,
    },
  });

  return Response.json({ success: true, mode: "created" });
}
