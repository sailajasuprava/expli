import { BlockStack, Text, Image, InlineStack, Box } from "@shopify/polaris";

export default function WelcomeScreen() {
  return (
    <BlockStack gap="300">
      {/* Heading */}
      <Text variant="headingLg">Welcome to MeetFlow!</Text>

      {/* Subheading */}
      <Text>
        Import your Shopify products, turn them into services, enable MeetFlow
        widget and that&apos;s it.
      </Text>

      <InlineStack align="center">
        <Box maxWidth="320px" margin="auto" paddingBlockStart="300">
          <Image
            source="/images/calender2.jpg"
            alt="MeetFlow appointment booking preview"
            width="100%"
          />
        </Box>
      </InlineStack>
    </BlockStack>
  );
}
