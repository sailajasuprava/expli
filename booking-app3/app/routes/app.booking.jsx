import React, { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Select,
  BlockStack,
  InlineStack,
  Box,
  Button,
  Badge,
} from "@shopify/polaris";

export default function NewBooking() {
  // State for form fields
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTime, setSelectedTime] = useState("11:00 AM");

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  return (
    <Page
      title="New Booking"
      subtitle="Create a new client appointment."
      backAction={{ content: "Dashboard", url: "#" }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="500">
            <BlockStack gap="500">
              {/* Client Details Section */}
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Client Details
                </Text>
                <InlineStack gap="400" align="start">
                  <Box width="48%">
                    <TextField
                      label="Client Name"
                      value={clientName}
                      onChange={(val) => setClientName(val)}
                      autoComplete="name"
                      placeholder="Enter client name"
                    />
                  </Box>
                  <Box width="48%">
                    <TextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(val) => setEmail(val)}
                      autoComplete="email"
                      placeholder="client@email.com"
                    />
                  </Box>
                </InlineStack>
                <InlineStack gap="400" align="start">
                  <Box width="48%">
                    <TextField
                      label="Phone Number"
                      type="tel"
                      value={phone}
                      onChange={(val) => setPhone(val)}
                      autoComplete="tel"
                      placeholder="+1 (555) 000-0000"
                    />
                  </Box>
                  <Box width="48%">
                    <Select
                      label="Existing Client?"
                      options={[
                        { label: "Search existing clients...", value: "" },
                      ]}
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>
              </BlockStack>

              {/* Appointment Details Section */}
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Appointment Details
                </Text>
                <InlineStack gap="400" align="start">
                  <Box width="48%">
                    <Select
                      label="Select Service"
                      options={[{ label: "Choose a service...", value: "" }]}
                      onChange={() => {}}
                    />
                  </Box>
                  <Box width="48%">
                    <Select
                      label="Staff Member"
                      options={[{ label: "Select staff member...", value: "" }]}
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>
                <InlineStack gap="400" align="start">
                  <Box width="48%">
                    <TextField
                      label="Appointment Date"
                      type="date"
                      placeholder="mm/dd/yyyy"
                      onChange={() => {}}
                    />
                  </Box>
                  <Box width="48%">
                    <TextField
                      label="Appointment Time"
                      type="time"
                      placeholder="--:-- --"
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>
                <InlineStack gap="400" align="start">
                  <Box width="48%">
                    <TextField
                      label="Duration"
                      value="60 minutes"
                      disabled
                      onChange={() => {}}
                    />
                  </Box>
                  <Box width="48%">
                    <Select
                      label="Location"
                      options={[{ label: "In-Person", value: "in-person" }]}
                      value="in-person"
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>
                <Box>
                  <Badge tone="info">Hair Cut & Style</Badge>
                </Box>
              </BlockStack>

              {/* Available Time Slots Section */}
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Available Time Slots
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                  }}
                >
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      pressed={selectedTime === time}
                      onClick={() => setSelectedTime(time)}
                      textAlign="center"
                    >
                      <Text
                        color={selectedTime === time ? "success" : "default"}
                      >
                        {time}
                      </Text>
                    </Button>
                  ))}
                </div>
              </BlockStack>

              {/* Notes Section */}
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Notes
                </Text>
                <InlineStack gap="400" align="start">
                  <Box width="48%">
                    <TextField
                      label="Internal Notes"
                      multiline={4}
                      placeholder="Add internal notes..."
                      onChange={() => {}}
                    />
                  </Box>
                  <Box width="48%">
                    <TextField
                      label="Client Notes"
                      multiline={4}
                      placeholder="Add client notes..."
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
