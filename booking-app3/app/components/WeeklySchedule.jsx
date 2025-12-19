import { InlineStack, TextField, Button } from "@shopify/polaris";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function WeeklySchedule() {
  return (
    <>
      {days.map((day) => (
        <InlineStack key={day} align="center" gap="200">
          <strong style={{ width: 40 }}>{day}</strong>
          <TextField value="09:00" />
          <span>to</span>
          <TextField value="17:00" />
          <Button>+</Button>
        </InlineStack>
      ))}
    </>
  );
}
