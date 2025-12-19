import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider, Frame } from "@shopify/polaris";

import enTranslations from "@shopify/polaris/locales/en.json";
import { authenticate } from "../shopify.server";
import "@shopify/polaris/build/esm/styles.css";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={enTranslations}>
        <Frame>
          <Outlet />
          <s-app-nav>
            <s-link href="/app">Dashboard</s-link>
            <s-link href="/app/availability">Availability</s-link>
            <s-link href="/app/events">Events </s-link>
            <s-link href="/app/booking">Booking</s-link>
          </s-app-nav>
        </Frame>
      </PolarisAppProvider>
    </ShopifyAppProvider>
  );
}

// Shopify needs React Router to catch thrown responses
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
