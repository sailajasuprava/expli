import { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import { Page, Card, Button, BlockStack, InlineStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

import WelcomeScreen from "../components/WelcomeScreen";
import StepHeader from "../components/StepHeader";
// import Step1AddService from "../components/Step1AddService";
import Step2BookingType from "../components/Step2BookingType";
import Step3TimeSlot from "../components/Step3TimeSlot";
import Step4WorkingHours from "../components/Step4WorkingHours";
import Step5EnableExtension from "../components/Step5EnableExtension";

/* -------------------- LOADER (IMPORTANT) -------------------- */
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 1, query: "title:Meetflow Appointment Booking") {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `);

  const data = await response.json();
  const productId = data.data.products.edges[0].node.id;

  return {
    shop: session.shop, // e.g. "sailaja-store-2.myshopify.com"
    themeExtensionId: process.env.THEME_EXTENSION_ID,
    productId,
  };
};
/* ------------------------------------------------------------ */

export default function AppIndex() {
  const { shop, productId, themeExtensionId } = useLoaderData(); // ✅ shop available everywhere

  useEffect(() => {
    console.log("AppIndex rendered, shop:", shop);
  }, [shop]);

  const [step, setStep] = useState(0);

  const next = () => {
    console.log("Continue clicked, step:", step);
    setStep((s) => Math.min(s + 1, 4));
  };

  const back = () => {
    console.log("Back clicked, step:", step);
    setStep((s) => Math.max(s - 1, 0));
  };

  return (
    <Page title="MeetFlow: Appointment Booking">
      <BlockStack gap="400">
        {step > 0 && <StepHeader currentStep={step} />}

        <Card padding="600">
          {/* Main content */}
          {step === 0 && <WelcomeScreen />}
          {/* {step === 1 && <Step1AddService />} */}
          {step === 1 && <Step2BookingType />}
          {step === 2 && <Step3TimeSlot productId={productId} />}
          {step === 3 && <Step4WorkingHours />}
          {step === 4 && (
            <Step5EnableExtension
              shop={shop}
              themeExtensionId={themeExtensionId}
            />
          )}

          {/* Navigation buttons */}
          <div style={{ marginTop: 32 }}>
            <InlineStack align="space-between" gap="200">
              <Button disabled={step === 0} onClick={back}>
                Back
              </Button>

              <Button variant="primary" onClick={next}>
                Continue
              </Button>
            </InlineStack>
          </div>
        </Card>
      </BlockStack>
    </Page>
  );
}
