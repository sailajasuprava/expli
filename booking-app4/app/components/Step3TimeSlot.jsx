import {
  BlockStack,
  Text,
  TextField,
  InlineStack,
  Select,
  Box,
} from "@shopify/polaris";
import { useState } from "react";

export default function Step3TimeSlot() {
  const [durationHours, setDurationHours] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [incrementValue, setIncrementValue] = useState("60");
  const [incrementUnit, setIncrementUnit] = useState("minutes");

  return (
    <BlockStack gap="400">
      {/* Heading */}
      <Text variant="headingLg">How long should each booking be?</Text>

      {/* Duration */}
      <BlockStack gap="200">
        <Text variant="headingSm">Duration</Text>

        <InlineStack gap="300">
          <Box width="260px">
            <TextField
              type="number"
              value={durationHours}
              onChange={setDurationHours}
              suffix="hour"
              autoComplete="off"
            />
          </Box>

          <Box width="260px">
            <TextField
              type="number"
              value={durationMinutes}
              onChange={setDurationMinutes}
              suffix="minutes"
              autoComplete="off"
            />
          </Box>
        </InlineStack>
      </BlockStack>

      {/* Start time increment */}
      <BlockStack gap="200">
        <Text variant="headingSm">Start time increment</Text>

        <InlineStack gap="300">
          <Box width="180px">
            <TextField
              type="number"
              value={incrementValue}
              onChange={setIncrementValue}
              autoComplete="off"
            />
          </Box>

          <Box width="260px">
            <Select
              options={[
                { label: "Minutes", value: "minutes" },
                { label: "Hours", value: "hours" },
              ]}
              value={incrementUnit}
              onChange={setIncrementUnit}
            />
          </Box>
        </InlineStack>

        {/* Helper text */}
        <Text variant="bodyMd" tone="subdued">
          Specific intervals for the start times display of bookings.
        </Text>
        <Text variant="bodyMd" tone="subdued">
          Eg: If the defined time is 1 hour, we will show the booking time slots
          every hour (i.e: 9:00 am, 10:00 am, 11:00 am, etc.)
        </Text>
      </BlockStack>
    </BlockStack>
  );
}
