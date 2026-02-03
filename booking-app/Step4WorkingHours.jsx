import {
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Box,
  Banner,
  Checkbox,
  Button,
} from "@shopify/polaris";
import { useState } from "react";
import { PlusIcon, DuplicateIcon, ClockIcon } from "@shopify/polaris-icons";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function Step4WorkingHours() {
  const [schedule, setSchedule] = useState({
    Sunday: { enabled: false },
    Monday: { enabled: true, start: "09:00", end: "17:00" },
    Tuesday: { enabled: true, start: "09:00", end: "17:00" },
    Wednesday: { enabled: true, start: "09:00", end: "17:00" },
    Thursday: { enabled: true, start: "09:00", end: "17:00" },
    Friday: { enabled: true, start: "09:00", end: "17:00" },
    Saturday: { enabled: false },
  });

  const toggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        start: prev[day].start || "09:00",
        end: prev[day].end || "17:00",
      },
    }));
  };

  const updateTime = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  return (
    <BlockStack gap="400">
      {/* Heading */}
      <BlockStack gap="100">
        <Text variant="headingLg">
          When are you available to accept bookings?
        </Text>
        <Text tone="subdued">
          This is the weekly schedule for assigned staff, which sets
          availability for this services. You can change it anytime.
        </Text>
      </BlockStack>

      {/* Days */}
      <BlockStack gap="300">
        {DAYS.map((day) => {
          const data = schedule[day];

          return (
            <InlineStack key={day} gap="300" align="left" wrap={false}>
              {/* LEFT COLUMN — fixed width */}
              <InlineStack gap="200" align="left" style={{ width: 180 }}>
                <Checkbox
                  label={day}
                  checked={data.enabled}
                  onChange={() => toggleDay(day)}
                  toggle
                />
              </InlineStack>

              {/* RIGHT COLUMN */}
              {!data.enabled ? (
                <Box
                  background="bg-surface-subdued"
                  padding="300"
                  borderRadius="200"
                  width="100%"
                >
                  <Text tone="subdued">Unavailable</Text>
                </Box>
              ) : (
                <InlineStack gap="200" align="center">
                  <Box width="140px">
                    <TextField
                      type="time"
                      value={data.start}
                      prefix={<ClockIcon />}
                      onChange={(v) => updateTime(day, "start", v)}
                    />
                  </Box>

                  <Text>-</Text>

                  <Box width="140px">
                    <TextField
                      type="time"
                      value={data.end}
                      prefix={<ClockIcon />}
                      onChange={(v) => updateTime(day, "end", v)}
                    />
                  </Box>

                  <Button icon={PlusIcon} />
                  <Button icon={DuplicateIcon} />
                </InlineStack>
              )}
            </InlineStack>
          );
        })}
      </BlockStack>

      {/* Info banner */}
      <Banner tone="info">
        If your appointments are on specific dates, you can set them up in the
        Date Range section later in the app, or{" "}
        <Text as="span" tone="info">
          Contact support
        </Text>{" "}
        for guidance.
      </Banner>
    </BlockStack>
  );
}
