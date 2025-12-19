/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  ButtonGroup,
  TextField,
  Modal,
  RadioButton,
  BlockStack,
  InlineStack,
  Checkbox,
  Link,
  Badge,
  IndexTable,
} from "@shopify/polaris";
import {
  SearchIcon,
  EditIcon,
  PlusIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";

import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const events = await prisma.event.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 3, // 🔑 top 3 most recent
  });

  return { events };
}

/* ---------------- Current Events ---------------- */

function CurrentEventsList({ events }) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" gap="100">
          <Text variant="headingMd">Current Events</Text>
          <InlineStack gap="200">
            <TextField
              placeholder="Find an event by name"
              prefix={<SearchIcon />}
              labelHidden
              label="Search"
            />
            <Button>Show inactive events</Button>
          </InlineStack>
        </InlineStack>

        <IndexTable
          resourceName={{ singular: "event", plural: "events" }}
          itemCount={events.length}
          selectable={false}
          headings={[
            { title: "Name" },
            { title: "Status" },
            { title: "Actions" },
          ]}
        >
          {events.map((event, index) => (
            <IndexTable.Row id={event.id} key={event.id} position={index}>
              <IndexTable.Cell>
                <BlockStack gap="100">
                  <Link removeUnderline>{event.name}</Link>
                  <Text as="span" tone="subdued">
                    {event.maxAttendees} attendee(s) / {event.duration} min
                  </Text>
                </BlockStack>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Badge tone="success">Active</Badge>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <ButtonGroup>
                  <Button icon={EditIcon}>Edit</Button>
                  <Button icon={PlusIcon}>Add a booking</Button>
                </ButtonGroup>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
      </BlockStack>
    </Card>
  );
}

/* ---------------- Payment Options ---------------- */

function PaymentOptions() {
  const [value, setValue] = useState("pay");

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingSm">Payment Options</Text>

        <RadioButton
          label="Pay to Book"
          helpText="Customers pay to book. Select this to allow online payments (full or partial)."
          checked={value === "pay"}
          id="pay"
          name="payment"
          onChange={() => setValue("pay")}
        />

        <RadioButton
          label="Book without Payment"
          helpText="Customers can book without paying (useful for free services or offline payment)."
          checked={value === "no-pay"}
          id="no-pay"
          name="payment"
          onChange={() => setValue("no-pay")}
        />

        <InlineStack align="space-between">
          <BlockStack>
            <Text>Enable Deposit</Text>
            <Text tone="subdued">
              If disabled, the customer will pay in full when they book
            </Text>
          </BlockStack>
          <Checkbox checked={false} onChange={() => {}} />
        </InlineStack>

        <InlineStack align="end">
          <Button>Update Payment Options</Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

/* ---------------- Intake Questions ---------------- */

function IntakeQuestions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <InlineStack align="space-between">
          <BlockStack>
            <Text variant="headingSm">Intake Questions</Text>
            <Text tone="subdued">Showing 6 intake questions</Text>
          </BlockStack>

          <Button icon={SettingsIcon} onClick={() => setOpen(true)}>
            Manage
          </Button>
        </InlineStack>

        <BlockStack gap="200" marginBlockStart="300">
          <Checkbox
            label="Do you agree to terms?"
            helpText="Dropdown"
            checked
            onChange={() => {}}
          />
        </BlockStack>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Manage Intake Questions"
        primaryAction={{ content: "Done", onAction: () => setOpen(false) }}
      >
        <Modal.Section>Manage your intake questions here.</Modal.Section>
      </Modal>
    </>
  );
}

/* ---------------- Main Page ---------------- */

export default function DashboardPage() {
  const { events } = useLoaderData();
  return (
    <Page
      title="Easy Appointment Booking Dashboard"
      subtitle="Create and manage events, bookings and availability"
    >
      <Layout>
        {/* Left (wide) */}
        <Layout.Section>
          <CurrentEventsList events={events} />
        </Layout.Section>

        {/* Middle */}
        <Layout.Section oneThird>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd">
                  Editing — <Link removeUnderline>Big Bang - LED</Link>
                </Text>
                <Text tone="subdued">
                  Manage event settings, payments, and intake questions
                </Text>
              </BlockStack>
            </Card>

            <PaymentOptions />
            <IntakeQuestions />
          </BlockStack>
        </Layout.Section>

        {/* Right */}
        <Layout.Section oneThird>
          <Card
            title="Preview / Checkout"
            actions={[{ content: "View in your store" }]}
          >
            <BlockStack gap="200">
              <Text tone="subdued">
                The checkout reflects your event configuration.
              </Text>
              <Button fullWidth>Simulate booking</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
