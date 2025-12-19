/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";

const Badge = ({ children, status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${
      status === "success"
        ? "bg-cyan-50 text-cyan-700 border-cyan-200"
        : "bg-gray-100 text-gray-700 border-gray-300"
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
      px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
      ${
      primary
        ? "bg-cyan-500 text-white border border-cyan-500 hover:bg-cyan-600 focus:ring-cyan-500 shadow-md hover:shadow-lg"
        : plain
          ? "text-blue-600 hover:text-blue-800 hover:underline px-0 py-0 border-none"
          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-cyan-500"
    }
      ${disclosure ? "relative pr-6" : ""}
      ${className}
      ${disabled ? "opacity-50 cursor-not-allowed shadow-none" : "cursor-pointer"}
    `}
  >
        {children}   {" "}
    {disclosure && (
      <span className="absolute top-1/2 right-2 transform -translate-y-1/2 text-xs">
                ▼      {" "}
      </span>
    )}
     {" "}
  </button>
);

const Card = ({ title, children, hasTitleBar = true, className = "" }) => (
  <div // Modernized Card: Larger shadow and more rounded corners
    className={`bg-white rounded-xl shadow-lg border border-gray-100 mb-6 ${className}`}
  >
       {" "}
    {hasTitleBar && (
      <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
             {" "}
      </div>
    )}
        <div className="p-6">{children}</div> {" "}
  </div>
);

const CardSection = ({ title, children, className = "" }) => (
  <div className={`py-5 px-6 border-t border-gray-100 ${className}`}>
       {" "}
    {title && (
      <h4 className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase">
                {title}     {" "}
      </h4>
    )}
        {children} {" "}
  </div>
);

// --- Main Component ---

export default function AppBookingDashboard() {
  const [paymentOption, setPaymentOption] = useState("payToBook");
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [showIntakeQuestions, setShowIntakeQuestions] = useState(true);

  const handlePaymentChange = useCallback(
    (e) => setPaymentOption(e.target.value),
    [],
  );
  const handleDepositToggle = useCallback(
    () => setDepositEnabled((prev) => !prev),
    [],
  );
  const handleShowIntakeToggle = useCallback(
    () => setShowIntakeQuestions((prev) => !prev),
    [],
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
    <div className="flex justify-end space-x-2">
           {" "}
      {/* Increased button size/padding slightly for better touch target */}   
        <Button className="!px-3 !py-1 !text-xs">Edit</Button>     {" "}
      <Button className="!px-3 !py-1 !text-xs" disclosure>
                + Add Booking      {" "}
      </Button>
           {" "}
      <Button className="!px-3 !py-1 !text-xs" plain>
                View      {" "}
      </Button>
         {" "}
    </div>
  );

  return (
    <div className="flex min-h-screen font-sans bg-gray-100 antialiased">
            {/* Left Sidebar - Added shadow-xl and rounded corners */}     {" "}
      <div className="w-60 bg-white pt-6 pb-4 border-r border-gray-200 flex-shrink-0 shadow-xl rounded-r-2xl">
               {" "}
        <div className="px-4">
                    {/* Logo: More prominent with background color */}         {" "}
          <div className="text-3xl font-extrabold text-white bg-cyan-500 w-10 h-10 flex items-center justify-center rounded-lg mb-2 shadow-md">
                        E            {" "}
          </div>
                   {" "}
          <div className="text-base font-semibold text-gray-800 mb-6 leading-tight">
                        Explified <br /> Appointments          {" "}
          </div>
                 {" "}
        </div>
               {" "}
        <nav>
                   {" "}
          <ul>
                       {" "}
            {/* Active Link: Higher contrast background, smoother transition */}
                       {" "}
            <li className="py-2.5 px-6 text-sm font-semibold text-cyan-700 bg-cyan-50 border-l-4 border-cyan-500 cursor-pointer transition-colors duration-150">
                            Dashboard            {" "}
            </li>
                       {" "}
            <li className="py-2.5 px-6 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                            Availability            {" "}
            </li>
                       {" "}
            <li className="py-2.5 px-6 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                            Events            {" "}
            </li>
                       {" "}
            <li className="py-2.5 px-6 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                            Settings            {" "}
            </li>
                       {" "}
            <li className="py-2.5 px-6 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                            Reports            {" "}
            </li>
                     {" "}
          </ul>
                 {" "}
        </nav>
             {" "}
      </div>
            {/* Main Content Area */}     {" "}
      <div className="flex-grow p-8">
                {/* Header - Cleaner layout and slightly larger text */}       {" "}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                   {" "}
          <div>
                       {" "}
            <h1 className="text-xl font-bold text-gray-900 mb-0">
                            Easy Appointment Booking Dashboard            {" "}
            </h1>
                       {" "}
            <p className="text-sm text-gray-500 mt-1">
                            Create and manage events, bookings and availability
                         {" "}
            </p>
                     {" "}
          </div>
                   {" "}
          <div className="flex space-x-3">
                        <Button className="!py-2 !px-4">View Bookings</Button> 
                      <Button className="!py-2 !px-4">View Availability</Button>
                       {" "}
            <Button primary className="!py-2 !px-4">
                            Create a new event or service            {" "}
            </Button>
                     {" "}
          </div>
                 {" "}
        </header>
                {/* Current Events Section (Top Card) */}       {" "}
        <div className="w-full">
                   {" "}
          <Card hasTitleBar={false} className="!p-0">
                        {/* Toolbar: Moved to header-style section */}         
             {" "}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                           {" "}
              <h2 className="text-lg font-semibold text-gray-900">
                                Current Events              {" "}
              </h2>
                           {" "}
              <div className="flex space-x-3">
                               {" "}
                <input
                  type="text"
                  placeholder="Find an event by name" // Modernized search input
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-cyan-500 focus:border-cyan-500"
                />
                               {" "}
                <Button className="!py-2 !px-4">Show inactive events</Button>   
                         {" "}
              </div>
                         {" "}
            </div>
                       {" "}
            {/* Table: Bolder headings, hover effect, cleaner padding */}       
               {" "}
            <div className="p-6 pt-0">
                           {" "}
              <table className="min-w-full divide-y divide-gray-200">
                               {" "}
                <thead>
                                   {" "}
                  <tr>
                                       {" "}
                    <th className="px-0 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Name                    {" "}
                    </th>
                                       {" "}
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="px-0 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-64">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                                   {" "}
                  {currentEvents.map(
                    (
                      event,
                      index, // Subtle hover effect on rows
                    ) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-100"
                      >
                                             {" "}
                        <td className="px-0 py-4 whitespace-nowrap">
                                                 {" "}
                          <div className="flex flex-col">
                                                     {" "}
                            <strong className="text-sm font-medium text-gray-900">
                                                          {event.name}         
                                             {" "}
                            </strong>
                                                     {" "}
                            <span className="text-xs text-gray-500 mt-0.5">
                                                          {event.variants}     
                                                 {" "}
                            </span>
                                                   {" "}
                          </div>
                                             {" "}
                        </td>
                                           {" "}
                        <td className="px-4 py-4 whitespace-nowrap">
                                               {" "}
                          <Badge status="success">{event.status}</Badge>       
                                     {" "}
                        </td>
                                           {" "}
                        <td className="px-0 py-4 whitespace-nowrap text-right">
                                                {renderEventActions()}         
                                   {" "}
                        </td>
                                         {" "}
                      </tr>
                    ),
                  )}
                               {" "}
                </tbody>
                           {" "}
              </table>
                         {" "}
            </div>
                     {" "}
          </Card>
                 {" "}
        </div>
                {/* Editing and Preview Sections (Lower Split) */}       {" "}
        <div className="grid grid-cols-3 gap-8 mt-6">
                    {/* Editing Card (Two-Thirds, now 2/3 column in grid) */}   
               {" "}
          <div className="col-span-2">
                       {" "}
            <Card title="Editing — Big Bang - LED" className="!p-0">
                           {" "}
              <CardSection className="!pt-4 !pb-4 border-none">
                               {" "}
                <p className="text-sm text-gray-600 font-medium">
                                    Manage event settings, payments, and intake
                  questions                {" "}
                </p>
                             {" "}
              </CardSection>
                            {/* Payment Options */}             {" "}
              <CardSection title="Payment Options" className="!pt-6">
                               {" "}
                <div className="flex flex-col space-y-5">
                                    {/* Radio buttons styled to look cleaner */}
                                   {" "}
                  <div className="flex items-start space-x-3">
                                       {" "}
                    <input
                      type="radio"
                      id="payToBook"
                      name="paymentOption"
                      value="payToBook"
                      checked={paymentOption === "payToBook"}
                      onChange={handlePaymentChange}
                      className="mt-1.5 focus:ring-cyan-500 h-4 w-4 text-cyan-500 border-gray-300"
                    />
                                       {" "}
                    <label
                      htmlFor="payToBook"
                      className="text-sm font-medium text-gray-900"
                    >
                                           {" "}
                      <strong className="block">Pay to Book</strong>           
                               {" "}
                      <p className="text-xs text-gray-500 mt-1 font-normal">
                                                Customers pay to book. Select
                        this to allow online                         payments
                        (full or partial).                      {" "}
                      </p>
                                         {" "}
                    </label>
                                     {" "}
                  </div>
                                   {" "}
                  <div className="flex items-start space-x-3">
                                       {" "}
                    <input
                      type="radio"
                      id="bookWithoutPayment"
                      name="paymentOption"
                      value="bookWithoutPayment"
                      checked={paymentOption === "bookWithoutPayment"}
                      onChange={handlePaymentChange}
                      className="mt-1.5 focus:ring-cyan-500 h-4 w-4 text-cyan-500 border-gray-300"
                    />
                    <label
                      htmlFor="bookWithoutPayment"
                      className="text-sm font-medium text-gray-900"
                    >
                                           {" "}
                      <strong className="block">Book without Payment</strong>   
                                       {" "}
                      <p className="text-xs text-gray-500 mt-1 font-normal">
                                                Customers can book without
                        paying (useful for free                         services
                        or offline payment).                      {" "}
                      </p>
                                         {" "}
                    </label>
                                     {" "}
                  </div>
                                   {" "}
                  {/* Enable Deposit: Cleaned up spacing and button */}         
                         {" "}
                  <div className="flex justify-between items-center pt-5 mt-4 border-t border-gray-100">
                                       {" "}
                    <div className="flex items-center space-x-2">
                                           {" "}
                      <input
                        type="checkbox"
                        id="enableDeposit"
                        checked={depositEnabled}
                        onChange={handleDepositToggle}
                        className="rounded focus:ring-cyan-500 h-4 w-4 text-cyan-500 border-gray-300"
                      />
                                           {" "}
                      <label
                        htmlFor="enableDeposit"
                        className="text-sm font-medium text-gray-900"
                      >
                                                Enable Deposit                  
                           {" "}
                      </label>
                                           {" "}
                      <span className="text-xs text-gray-500 ml-4 hidden md:inline">
                                                If disabled, customer pays in
                        full when booking.                      {" "}
                      </span>
                                         {" "}
                    </div>
                                       {" "}
                    <Button
                      className="!px-3 !py-1.5 !text-sm"
                      disabled={!depositEnabled}
                    >
                                            Update Options                  
                       {" "}
                    </Button>
                                     {" "}
                  </div>
                                 {" "}
                </div>
                             {" "}
              </CardSection>
                            {/* Intake Questions */}             {" "}
              <CardSection title="Intake Questions" className="!py-6">
                               {" "}
                <div className="flex justify-between items-center">
                                   {" "}
                  <div>
                                       {" "}
                    <p className="text-xs text-gray-500 mb-3">
                                            Showing 6 intake questions          
                               {" "}
                    </p>
                                       {" "}
                    <div className="flex items-center space-x-3">
                                           {" "}
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={showIntakeQuestions}
                        onChange={handleShowIntakeToggle}
                        disabled
                        className="rounded focus:ring-cyan-500 h-4 w-4 text-cyan-500 border-gray-300 opacity-50"
                      />
                                           {" "}
                      <label
                        htmlFor="agreeToTerms"
                        className="text-sm text-gray-900"
                      >
                                                Do you agree to terms?          
                                   {" "}
                      </label>
                                           {" "}
                      <select // Modernized select input
                        className="px-3 py-1.5 border border-gray-300 bg-gray-50 rounded-lg text-sm text-gray-600 opacity-70 cursor-not-allowed"
                        disabled
                      >
                                                <option>Dropdown</option>       
                                     {" "}
                      </select>
                                         {" "}
                    </div>
                                     {" "}
                  </div>
                                   {" "}
                  <Button plain className="text-sm text-blue-600">
                                        Manage                  {" "}
                  </Button>
                                 {" "}
                </div>
                             {" "}
              </CardSection>
                         {" "}
            </Card>
                     {" "}
          </div>
                   {" "}
          {/* Preview / Checkout (One-Third, now 1/3 column in grid) */}       
           {" "}
          <div className="col-span-1">
                       {" "}
            <Card title="Preview / Checkout" className="!pb-6">
                           {" "}
              <div className="flex justify-end mb-4">
                               {" "}
                <a href="#" className="text-sm text-blue-600 hover:underline">
                                    View in your store                {" "}
                </a>
                             {" "}
              </div>
                           {" "}
              {/* Simulated empty preview area with a nicer background/border */}
                           {" "}
              <div className="h-80 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                Event Preview Area
              </div>
                         {" "}
            </Card>
                     {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
}
