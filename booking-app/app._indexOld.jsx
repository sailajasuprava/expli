/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";

// --- Helper Components for Reusability and Clarity ---

const Badge = ({ children, status }) => (
  <span
    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full leading-none ${
      status === "success" ? "bg-cyan-100 text-cyan-700" : ""
    }`}
  >
    {children}
  </span>
);

const Button = ({
  children,
  primary,
  plain,
  disclosure,
  onClick,
  disabled,
  className = "",
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-2 text-sm rounded-md transition-colors duration-200 
      ${
        primary
          ? "bg-cyan-500 text-white border border-cyan-500 hover:bg-cyan-600"
          : plain
          ? "text-blue-700 hover:underline px-0 py-0 border-none"
          : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
      }
      ${disclosure ? "relative pr-6" : ""}
      ${className}
      ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    {children}
    {disclosure && (
      <span className="absolute top-1/2 right-2 transform -translate-y-1/2 text-xs">
        ▼
      </span>
    )}
  </button>
);

const Card = ({ title, children, hasTitleBar = true, className = "" }) => (
  <div
    className={`bg-white rounded-lg shadow border border-gray-200 mb-6 ${className}`}
  >
    {hasTitleBar && (
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

const CardSection = ({ title, children, className = "" }) => (
  <div className={`py-4 px-5 border-t border-gray-100 ${className}`}>
    {title && (
      <h4 className="text-sm font-semibold text-gray-800 mb-3">{title}</h4>
    )}
    {children}
  </div>
);

// --- Main Component ---

export default function AppBookingDashboard() {
  const [paymentOption, setPaymentOption] = useState("payToBook");
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [showIntakeQuestions, setShowIntakeQuestions] = useState(true);

  const handlePaymentChange = useCallback(
    (e) => setPaymentOption(e.target.value),
    []
  );
  const handleDepositToggle = useCallback(
    () => setDepositEnabled((prev) => !prev),
    []
  );
  const handleShowIntakeToggle = useCallback(
    () => setShowIntakeQuestions((prev) => !prev),
    []
  );

  const currentEvents = [
    { name: "Big Bang - LED", variants: "1 variant / 45min", status: "Active" },
    {
      name: "Canadian Cooking Experience Event",
      variants: "2 variants / 60min",
      status: "Active",
    },
    {
      name: "CPR Course - Toronto",
      variants: "1 variant / 240min",
      status: "Active",
    },
  ];

  const renderEventActions = () => (
    <div className="flex justify-end space-x-1">
      <Button className="!px-2 !py-1 !text-xs">Edit</Button>
      <Button className="!px-2 !py-1 !text-xs" disclosure>
        + Add a Booking
      </Button>
      <Button className="!px-2 !py-1 !text-xs" plain>
        View
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen font-sans bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-44 bg-white pt-4 pb-4 border-r border-gray-200 flex-shrink-0">
        <div className="px-4">
          <div className="text-2xl font-bold text-cyan-600 bg-cyan-50 w-8 h-8 flex items-center justify-center rounded-md mb-4">
            E
          </div>
          <div className="text-sm text-gray-600 mb-4 leading-tight">
            Explified <br /> Appointments
          </div>
        </div>
        <nav>
          <ul>
            {/* Active Link */}
            <li className="py-2 px-4 text-sm font-semibold text-gray-900 bg-gray-100 border-l-4 border-cyan-600 cursor-pointer">
              Dashboard
            </li>
            <li className="py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              Availability
            </li>
            <li className="py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              Events
            </li>
            <li className="py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              Settings
            </li>
            <li className="py-2 px-4 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              Reports
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-6">
        {/* Header */}
        <header className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Easy Appointment Booking Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Create and manage events, bookings and availability
            </p>
          </div>
          <div className="flex space-x-2">
            <Button>View Bookings</Button>
            <Button>View Availability</Button>
            <Button primary>Create a new event or service</Button>
          </div>
        </header>

        {/* Current Events Section (Top Card) */}
        <div className="w-full">
          <Card hasTitleBar={false} className="!p-0">
            <div className="flex justify-between items-center p-5 pb-0">
              <h2 className="text-base font-semibold text-gray-800">
                Current Events
              </h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Find an event by name"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                />
                <Button>Show inactive events</Button>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-100 mt-4">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-normal text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-normal text-gray-500 uppercase tracking-wider w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentEvents.map((event, index) => (
                  <tr key={index}>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <strong className="text-sm font-medium text-gray-900">
                          {event.name}
                        </strong>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {event.variants}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <Badge status="success">{event.status}</Badge>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      {renderEventActions()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Editing and Preview Sections (Lower Split) */}
        <div className="flex gap-6">
          {/* Editing Card (Two-Thirds) */}
          <div className="w-2/3">
            <Card title="Editing — Big Bang - LED" className="!p-0">
              <CardSection className="!pt-3 !pb-3">
                <p className="text-sm text-gray-800 font-medium">
                  Manage event settings, payments, and intake questions
                </p>
              </CardSection>

              {/* Payment Options */}
              <CardSection title="Payment Options" className="!pt-4">
                <div className="flex flex-col space-y-4">
                  {/* Pay to Book */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="radio"
                      id="payToBook"
                      name="paymentOption"
                      value="payToBook"
                      checked={paymentOption === "payToBook"}
                      onChange={handlePaymentChange}
                      className="mt-1.5 focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                    />
                    <label
                      htmlFor="payToBook"
                      className="text-sm font-medium text-gray-900"
                    >
                      <strong className="block">Pay to Book</strong>
                      <p className="text-xs text-gray-500 mt-1 font-normal">
                        Customers pay to book. Select this to allow online
                        payments (full or partial).
                      </p>
                    </label>
                  </div>

                  {/* Book without Payment */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="radio"
                      id="bookWithoutPayment"
                      name="paymentOption"
                      value="bookWithoutPayment"
                      checked={paymentOption === "bookWithoutPayment"}
                      onChange={handlePaymentChange}
                      className="mt-1.5 focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                    />
                    <label
                      htmlFor="bookWithoutPayment"
                      className="text-sm font-medium text-gray-900"
                    >
                      <strong className="block">Book without Payment</strong>
                      <p className="text-xs text-gray-500 mt-1 font-normal">
                        Customers can book without paying (useful for free
                        services or offline payment).
                      </p>
                    </label>
                  </div>

                  {/* Enable Deposit */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="enableDeposit"
                        checked={depositEnabled}
                        onChange={handleDepositToggle}
                        className="rounded focus:ring-cyan-500 h-4 w-4 text-cyan-600 border-gray-300"
                      />
                      <label
                        htmlFor="enableDeposit"
                        className="text-sm font-medium text-gray-900"
                      >
                        Enable Deposit
                      </label>
                      <span className="text-xs text-gray-500 ml-4">
                        If disabled, the customer will pay in full when they
                        book
                      </span>
                    </div>
                    <Button
                      className="!px-3 !py-1.5 !text-sm"
                      disabled={!depositEnabled}
                    >
                      Update Payment Options
                    </Button>
                  </div>
                </div>
              </CardSection>

              {/* Intake Questions */}
              <CardSection title="Intake Questions" className="!py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Showing 6 intake questions
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={showIntakeQuestions}
                        onChange={handleShowIntakeToggle}
                        disabled
                        className="rounded h-4 w-4 text-cyan-600 border-gray-300 opacity-50"
                      />
                      <label
                        htmlFor="agreeToTerms"
                        className="text-sm text-gray-900"
                      >
                        Do you agree to terms?
                      </label>
                      <select
                        className="px-2 py-1 border border-gray-300 bg-gray-50 rounded-md text-sm text-gray-600 opacity-70 cursor-not-allowed"
                        disabled
                      >
                        <option>Dropdown</option>
                      </select>
                    </div>
                  </div>
                  <Button plain className="text-sm text-blue-700">
                    Manage
                  </Button>
                </div>
              </CardSection>
            </Card>
          </div>

          {/* Preview / Checkout (One-Third) */}
          <div className="w-1/3">
            <Card title="Preview / Checkout" className="!pb-5">
              <div className="flex justify-end mb-4">
                <a href="#" className="text-sm text-blue-700 hover:underline">
                  View in your store
                </a>
              </div>
              {/* Simulated empty preview area */}
              <div className="h-72 border border-gray-300 rounded-md bg-gray-50"></div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
