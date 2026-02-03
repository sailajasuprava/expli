import { InlineStack, Box, Text, Icon } from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";

const STEPS = [
  // "Add first service",
  "Select booking type",
  "Set up time slot",
  "Set working hours",
  "Enable extension",
];

export default function StepHeader({ currentStep }) {
  return (
    <InlineStack gap="300" align="start" wrap={false}>
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <Box
            key={label}
            padding="300"
            minWidth="180px"
            borderRadius="300"
            borderWidth="050"
            borderColor={
              isCompleted
                ? "border-success" // 🟢 completed
                : isActive
                  ? "border-interactive" // 🔵 active
                  : "border-subdued" // ⚪ upcoming
            }
            background={"bg-surface"}
          >
            <InlineStack gap="200" align="center">
              {/* Icon */}
              {isCompleted ? (
                <Icon source={CheckCircleIcon} tone="success" />
              ) : (
                <Box
                  width="20px"
                  height="20px"
                  borderRadius="full"
                  background={isActive ? "interactive" : "bg-fill"}
                />
              )}

              {/* Text */}
              <Box>
                {/* <Text
                  variant="bodyMd"
                  fontWeight="semibold"
                  tone={
                    isCompleted
                      ? "success" // 🟢 Step X/5
                      : isActive
                        ? "var(--step-active-color)" // 🔵 Step X/5
                        : "subdued" // ⚪ upcoming
                  }
                >
                  Step {stepNumber}/4
                </Text> */}

                <span
                  className={`font-semibold ${isCompleted ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400"}`}
                >
                  Step {stepNumber}/4
                </span>

                <Text
                  variant="bodySm"
                  fontWeight={isActive ? "semibold" : "regular"}
                  tone={isActive ? "base" : "subdued"}
                >
                  {label}
                </Text>
              </Box>
            </InlineStack>
          </Box>
        );
      })}
    </InlineStack>
  );
}
