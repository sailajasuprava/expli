import { BlockStack, Text, RadioButton } from "@shopify/polaris";

export default function Step2BookingType() {
  return (
    <BlockStack gap="300">
      <Text variant="headingLg">What type of service do you offer?</Text>

      <RadioButton
        label="Hour-based bookings"
        checked
        helpText="Book an appointment or event at a specific date and time."
      />
    </BlockStack>
  );
}
