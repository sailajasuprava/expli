/* eslint-disable react/prop-types */
import { BlockStack, Text, Button, List, InlineStack } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

export default function Step5EnableExtension({ shop }) {
  const app = useAppBridge();

  const handleActivate = () => {
    const storeHandle = shop.replace(".myshopify.com", "");

    // 🔑 This MUST be the Theme App Extension ID from `shopify app dev`
    const THEME_EXTENSION_ID = "b951a800586a::meetflow-theme";
    // ⬆️ replace with your real value from the terminal

    const url = `https://admin.shopify.com/store/${storeHandle}/themes/current/editor?context=apps&activateAppId=${THEME_EXTENSION_ID}`;

    // Break out of iframe and open Shopify Admin correctly
    window.open(url, "_top");
  };

  return (
    <BlockStack gap="400">
      {/* Heading */}
      <Text variant="headingLg">Make your service go live</Text>

      {/* Description */}
      <Text>
        To make the booking button and widget available on your store, follow
        these steps:
      </Text>

      {/* Numbered steps */}
      <List type="number">
        <List.Item>
          Click on <strong>Activate MeetFlow</strong> button below
        </List.Item>

        <List.Item>
          Turn on <strong>MeetFlow extension</strong>
        </List.Item>

        <List.Item>
          Click <strong>Save</strong> button at the top right
        </List.Item>

        <List.Item>
          <strong>Return</strong> to this tab to continue using MeetFlow after
          enabling extension
        </List.Item>
      </List>

      {/* Activated status */}
      <InlineStack align="start">
        <Button variant="primary" onClick={handleActivate}>
          Activate MeetFlow
        </Button>
      </InlineStack>
    </BlockStack>
  );
}
