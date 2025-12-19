import {
  Page,
  Card,
  Text,
  IndexTable,
  Badge,
  Button,
  ButtonGroup,
  BlockStack,
  Link,
  Modal,
} from "@shopify/polaris";
import { EditIcon, ViewIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useLoaderData, useSubmit, useNavigate } from "react-router";
import { useState } from "react";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/* ---------------- LOADER ---------------- */

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const events = await prisma.event.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  return { events };
}

/* ---------------- ACTION ---------------- */

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const intent = formData.get("intent");

  if (intent !== "delete") {
    return Response.json({ ok: true });
  }

  const eventId = formData.get("eventId");

  if (!eventId) {
    return Response.json({ error: "Missing event id" }, { status: 400 });
  }

  // 🔐 Ensure shop ownership
  await prisma.event.deleteMany({
    where: {
      id: eventId,
      shop: session.shop,
    },
  });

  return Response.json({ success: true });
}

/* ---------------- PAGE ---------------- */

export default function EventsPage() {
  const { events } = useLoaderData();
  const submit = useSubmit();
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState(null);

  function handleDelete() {
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("eventId", deleteId);

    submit(formData, { method: "post" });
    setDeleteId(null);
  }

  return (
    <Page title="Events">
      <Card>
        {events.length === 0 ? (
          <BlockStack gap="200">
            <Text>No events created yet.</Text>
            <Button url="/app/availability" primary>
              Create your first event
            </Button>
          </BlockStack>
        ) : (
          <IndexTable
            resourceName={{ singular: "event", plural: "events" }}
            itemCount={events.length}
            selectable={false}
            headings={[
              { title: "Name" },
              { title: "Duration" },
              { title: "Status" },
              { title: "Actions" },
            ]}
          >
            {events.map((event, index) => (
              <IndexTable.Row
                id={String(event.id)}
                key={event.id}
                position={index}
              >
                <IndexTable.Cell>
                  <BlockStack gap="100">
                    <Link removeUnderline>{event.name}</Link>
                    <Text tone="subdued">{event.maxAttendees} attendee(s)</Text>
                  </BlockStack>
                </IndexTable.Cell>

                <IndexTable.Cell>{event.duration} min</IndexTable.Cell>

                <IndexTable.Cell>
                  <Badge tone="success">Active</Badge>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  <ButtonGroup>
                    <Button
                      icon={EditIcon}
                      onClick={() =>
                        navigate(`/app/availability?eventId=${event.id}`)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      icon={DeleteIcon}
                      destructive
                      onClick={() => setDeleteId(event.id)}
                    >
                      Delete
                    </Button>
                  </ButtonGroup>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>

      {/* -------- Delete Confirmation -------- */}
      <Modal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete event?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDelete,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setDeleteId(null) },
        ]}
      >
        <Modal.Section>
          <Text>
            This action cannot be undone. Are you sure you want to delete this
            event?
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
