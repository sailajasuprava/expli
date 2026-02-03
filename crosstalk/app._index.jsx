import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import "@shopify/polaris/build/esm/styles.css";
import { useLoaderData } from "react-router";

import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Tag,
  Button,
  Select,
  TextField,
  ChoiceList,
  Divider,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  return Response.json({
    shop: session.shop,
    appId: process.env.SHOPIFY_APP_ID,
    appHandle: "crosstalk-localization", // Hardcode or from env
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    }
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    }
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

const mockLanguages = [
  "Betawi",
  "Bhojpuri",
  "Bikol",
  "Bosnian",
  "Breton",
  "Bulgarian",
  "Buryat",
  "Cantonese",
  "Catalan",
  "Cebuano",
  "Chamorro",
  "Chechen",
  "Chichewa",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Chuukese",
  "Chuvash",
  "Corsican",
  "Crimean Tatar",
  "Croatian",
  "Czech",
  "Danish",
  "Dari",
  "Dhivehi",
  "Dinka",
  "Dogri",
  "Dombe",
  "Dutch",
  "Dyula",
  "Dzongkha",
  "English",
  "Esperanto",
  "Estonian",
  "Ewe",
  "Faroese",
  "Fijian",
  "Filipino",
  "Finnish",
  "Fon",
  "French",
  "Frisian",
  "Friulian",
  "Fulani",
  "Ga",
  "Galician",
  "Georgian",
];

export default function Index() {
  const { shop, appId } = useLoaderData();

  const handleEnableEmbed = () => {
    if (!shop) {
      console.error("Shop is missing");
      return;
    }

    const storeHandle = shop.replace(".myshopify.com", "");

    const extensionHandle = "crosstalk-localization"; // theme extension folder name
    const activateAppId = `app-embed-block-id://${appId}/${extensionHandle}`;

    const url = `https://admin.shopify.com/store/${storeHandle}/themes/current/editor?context=apps&activateAppId=${encodeURIComponent(
      activateAppId
    )}`;

    window.open(
      `https://${shop}/admin/themes/current/editor?context=apps`,
      "_blank"
    );
    // window.open(url, "_top");
  };

  return (
    <Page title="Dashboard">
      <Layout>
        {/* 1. Dashboard banner (screenshot 3) */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd"></Text>
                </BlockStack>
                <Select
                  label="Selected Language"
                  labelHidden
                  options={[
                    { label: "Select Language", value: "select" },
                    { label: "English", value: "en" },
                    { label: "French", value: "fr" },
                  ]}
                  value="select"
                  onChange={() => {}}
                />
              </InlineStack>

              <Box
                padding="400"
                background="bg-surface-warning"
                borderRadius="200"
              >
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Get Started! Enable the App
                  </Text>
                  <Text as="p">
                    Get setup in 10 seconds! Click the button below to enable
                    the app embed in your theme, and remember to click save.
                  </Text>
                  <InlineStack>
                    {" "}
                    <Button
                      variant="primary"
                      size="large"
                      onClick={handleEnableEmbed}
                    >
                      Enable App Embed
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* 2. Language Selector configuration (screenshot 2) */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Language Selector
              </Text>

              {/* Toggle icon/text variants */}
              <ChoiceList
                title="Button type"
                choices={[
                  { label: "Icon & Text Button", value: "icon-text" },
                  { label: "Icon Button Only", value: "icon" },
                  { label: "Text Button Only", value: "text" },
                ]}
                selected={["icon-text"]}
                onChange={() => {}}
              />

              <Divider />

              {/* Icon button shape and icon row */}
              <InlineStack gap="400" wrap>
                <Box minWidth="220px">
                  <Select
                    label="Icon Button Shape"
                    options={[
                      { label: "Circle", value: "circle" },
                      { label: "Square", value: "square" },
                      { label: "Rounded square", value: "rounded" },
                    ]}
                    value="circle"
                    onChange={() => {}}
                  />
                </Box>

                <InlineStack gap="200" align="center">
                  <Box>
                    <Text as="p" variant="bodyMd">
                      Button Color
                    </Text>
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="100"
                      background="bg"
                      borderColor="border-strong"
                      borderWidth="025"
                    />
                  </Box>
                  <Box>
                    <Text as="p" variant="bodyMd">
                      Icon Color
                    </Text>
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="100"
                      background="bg"
                      borderColor="border-strong"
                      borderWidth="025"
                    />
                  </Box>
                </InlineStack>
              </InlineStack>

              {/* Icon selection / upload */}
              <InlineStack gap="400" wrap>
                <Box>
                  <Text as="p" variant="bodySm">
                    Select an icon
                  </Text>
                  <InlineStack gap="200" align="center">
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="200"
                      background="bg-surface-secondary"
                      borderColor="border"
                      borderWidth="025"
                    />
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="200"
                      background="bg-surface-secondary"
                      borderColor="border"
                      borderWidth="025"
                    />
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="200"
                      background="bg-surface-secondary"
                      borderColor="border"
                      borderWidth="025"
                    />
                    <Box
                      width="40px"
                      height="40px"
                      borderRadius="200"
                      background="bg-surface-secondary"
                      borderColor="border"
                      borderWidth="025"
                    />
                  </InlineStack>
                </Box>

                <Box>
                  <Text as="p" variant="bodySm">
                    Or upload image
                  </Text>
                  <Button outline>Add image</Button>
                  <Text as="p" tone="subdued" variant="bodyXs">
                    Max 10MB; jpeg, png, webp
                  </Text>
                  <TextField label="URL" labelHidden placeholder="URL" />
                </Box>
              </InlineStack>

              <Divider />

              {/* Text button subsection */}
              <BlockStack gap="200">
                <Text as="p" variant="headingSm">
                  Text Button
                </Text>
                <InlineStack gap="300" wrap>
                  <Box minWidth="220px">
                    <Select
                      label="Label type"
                      options={[
                        { label: "Language Label", value: "language" },
                        { label: "Custom Label", value: "custom" },
                      ]}
                      value="language"
                      onChange={() => {}}
                    />
                  </Box>
                  <Box minWidth="220px">
                    <Select
                      label="Shape"
                      options={[
                        { label: "Rounded square", value: "rounded" },
                        { label: "Pill", value: "pill" },
                        { label: "Square", value: "square" },
                      ]}
                      value="rounded"
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>

                <InlineStack gap="300" wrap>
                  <TextField
                    label="Custom Text Label"
                    placeholder="Translate"
                  />
                  <Box minWidth="220px">
                    <TextField
                      label="Use *lang* to display selected language"
                      value="Translate *lang*"
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>

                <InlineStack gap="200" align="center">
                  <Button size="micro">Bold</Button>
                  <Box maxWidth="260px">
                    <TextField
                      type="range"
                      label="Font Size"
                      value="16"
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>

                <InlineStack gap="300" wrap>
                  <Box>
                    <Text as="p" variant="bodySm">
                      Text Color
                    </Text>
                    <Box
                      width="32px"
                      height="32px"
                      borderRadius="200"
                      background="bg"
                      borderColor="border-strong"
                      borderWidth="025"
                    />
                  </Box>
                  <Box>
                    <Text as="p" variant="bodySm">
                      Background
                    </Text>
                    <Box
                      width="32px"
                      height="32px"
                      borderRadius="200"
                      background="bg"
                      borderColor="border-strong"
                      borderWidth="025"
                    />
                  </Box>
                </InlineStack>
              </BlockStack>

              <Divider />

              {/* Disable translation and z-index */}
              <InlineStack gap="300" wrap>
                <Box maxWidth="260px">
                  <TextField
                    label="'Disable Translation' Label"
                    value="Disable Translation"
                    onChange={() => {}}
                  />
                </Box>
                <Box maxWidth="260px">
                  <TextField label="Button Z-Index" value="2347483648" />
                </Box>
              </InlineStack>

              <Divider />

              {/* Desktop / Mobile settings */}
              <BlockStack gap="300">
                <Text as="p" variant="headingSm">
                  Settings below apply for desktop & mobile separately
                </Text>

                <InlineStack gap="300" wrap>
                  <Button primary>Desktop Settings</Button>
                  <Button>Mobile Settings</Button>
                </InlineStack>

                <ChoiceList
                  title=""
                  choices={[
                    {
                      label: "Show Language Selector - Desktop",
                      value: "show-desktop",
                    },
                  ]}
                  selected={["show-desktop"]}
                  onChange={() => {}}
                />

                <InlineStack gap="300" wrap>
                  <Box minWidth="260px">
                    <Select
                      label="Button Position"
                      options={[
                        {
                          label: "Floating (moves with page)",
                          value: "floating",
                        },
                        { label: "Fixed", value: "fixed" },
                      ]}
                      value="floating"
                      onChange={() => {}}
                    />
                  </Box>
                  <Box minWidth="260px">
                    <Select
                      label="Vertical alignment"
                      options={[
                        { label: "Bottom Right", value: "bottom-right" },
                        { label: "Bottom Left", value: "bottom-left" },
                      ]}
                      value="bottom-right"
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>

                <InlineStack gap="300" wrap>
                  <Box maxWidth="180px">
                    <TextField
                      label="Horizontal margin"
                      suffix="px"
                      value="13"
                      onChange={() => {}}
                    />
                  </Box>
                  <Box maxWidth="180px">
                    <TextField
                      label="Vertical margin"
                      suffix="px"
                      value="13"
                      onChange={() => {}}
                    />
                  </Box>
                  <Box maxWidth="180px">
                    <TextField
                      label="Button size"
                      suffix="px"
                      value="55"
                      onChange={() => {}}
                    />
                  </Box>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* 3. Language options section (screenshot 1) */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="050">
                <Text as="h2" variant="headingMd">
                  Language options
                </Text>
                <Text as="p" tone="subdued">
                  Select which language options to offer with the Language
                  Selector Button.
                </Text>
              </BlockStack>

              <Box
                padding="300"
                borderWidth="025"
                borderRadius="200"
                borderColor="border"
                background="bg-surface-secondary"
              >
                <InlineStack gap="100" wrap={true}>
                  {mockLanguages.map((lang) => (
                    <Tag key={lang} onRemove={() => {}}>
                      {lang}
                    </Tag>
                  ))}
                </InlineStack>
              </Box>

              <Box maxWidth="400px">
                <TextField
                  label="Search & select languages"
                  labelHidden
                  placeholder="Search & select languages"
                />
              </Box>

              <InlineStack gap="200">
                <Button>Unselect All</Button>
                <Button primary>Select All</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
