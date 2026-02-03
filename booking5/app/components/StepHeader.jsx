import { InlineStack, Box, Text, Icon } from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";

const STEPS = [
  "Select booking type",
  "Set up time slot",
  "Set working hours",
  "Enable extension",
];

export default function StepHeader({ currentStep }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={label} className="relative">
              {/* Step Card */}
              <div
                className={`
                  relative z-10 flex flex-col justify-center w-full p-5 rounded-2xl border-2 
                  transition-all duration-500 ease-out backdrop-blur-sm
                  ${isCompleted ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm hover:shadow-green-100 hover:shadow-lg" : ""}
                  ${isActive ? "border-blue-500 bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg shadow-blue-100" : ""}
                  ${isUpcoming ? "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 opacity-70 hover:opacity-85" : ""}
                  hover:transform hover:translate-y-[-2px] cursor-pointer
                `}
              >
                {/* Glowing effect for active step */}
                {/* {isActive && (
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl opacity-30 blur-sm animate-pulse" />
                )} */}

                <InlineStack
                  gap="300"
                  align="start"
                  blockAlign="center"
                  wrap={false}
                >
                  {/* Status Indicator */}
                  <div className="flex-shrink-0 relative">
                    {isCompleted ? (
                      <div className="transform scale-110 transition-transform duration-300 hover:scale-125 hover:rotate-12">
                        <Icon source={CheckCircleIcon} tone="success" />
                        {/* Success ring animation */}
                        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-20" />
                      </div>
                    ) : (
                      <div
                        className={`
                          w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 
                          transition-all duration-300 shadow-sm
                          ${
                            isActive
                              ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white shadow-blue-200"
                              : "bg-white border-gray-300 text-gray-400 hover:border-gray-400"
                          }
                        `}
                      >
                        {stepNumber}
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col gap-1 relative z-10">
                    <span
                      className={`
                        text-[11px] uppercase tracking-widest font-extrabold
                        transition-colors duration-300
                        ${isCompleted ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400"}
                      `}
                    >
                      Step {stepNumber} of {STEPS.length}
                    </span>

                    <div className="leading-snug">
                      <Text
                        variant="bodySm"
                        fontWeight={isActive ? "bold" : "medium"}
                        tone={isUpcoming ? "subdued" : "base"}
                      >
                        {label}
                      </Text>
                    </div>

                    {/* Progress bar for active step */}
                    {isActive && (
                      <div className="mt-2 w-full bg-blue-200/40 rounded-full h-1 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full w-3/4 shadow-sm" />
                      </div>
                    )}
                  </div>
                </InlineStack>

                {/* Corner accent for completed steps */}
                {isCompleted && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-sm" />
                )}

                {/* Active step indicator badge */}
                {/* {isActive && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">
                    Active
                  </div>
                )} */}
              </div>

              {/* Connecting Line - Hidden on mobile, shown as bottom line on larger screens */}
              {index < STEPS.length - 1 && (
                <>
                  {/* Horizontal line for desktop (lg and up) */}
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-4 h-[3px] -translate-y-1/2">
                    {/* Background line */}
                    <div className="absolute inset-0 bg-gray-200 rounded-full" />

                    {/* Animated progress line */}
                    <div
                      className={`
                        absolute inset-0 rounded-full transition-all duration-700 ease-in-out
                        ${
                          stepNumber < currentStep
                            ? "bg-gradient-to-r from-green-500 to-green-400 w-full shadow-sm"
                            : stepNumber === currentStep
                              ? "bg-gradient-to-r from-green-500 via-blue-400 to-gray-200 w-1/2 animate-pulse"
                              : "w-0"
                        }
                      `}
                    />

                    {/* Animated dot for active connection */}
                    {stepNumber === currentStep && (
                      <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full -translate-y-1/2 -translate-x-1/2 animate-ping" />
                    )}
                  </div>

                  {/* Vertical line for tablet (md only) */}
                  <div className="hidden md:block lg:hidden absolute -bottom-4 left-1/2 w-[3px] h-4 -translate-x-1/2">
                    {/* Background line */}
                    <div className="absolute inset-0 bg-gray-200 rounded-full" />

                    {/* Animated progress line */}
                    <div
                      className={`
                        absolute inset-0 rounded-full transition-all duration-700 ease-in-out
                        ${
                          stepNumber < currentStep
                            ? "bg-gradient-to-b from-green-500 to-green-400 h-full shadow-sm"
                            : stepNumber === currentStep
                              ? "bg-gradient-to-b from-green-500 via-blue-400 to-gray-200 h-1/2 animate-pulse"
                              : "h-0"
                        }
                      `}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
