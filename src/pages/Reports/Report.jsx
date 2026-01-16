import {
  FiBell,
  FiUser,
  FiFilter,
  FiUpload,
  FiSearch,
  FiDownload,
} from "react-icons/fi";
import {
  KPICardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "../../components/SkeletonLoader";
import { useState, useEffect } from "react";
import Financial from "./components/Financial";
import StandardReports from "./components/StandardReports";
import RenewalAndExpiration from "./components/RenewalAndExpiration";

const Report = () => {
  const [activeTab, setActiveTab] = useState("standard");
  const [isLoading, setIsLoading] = useState(true);

  // KPI Data
  const kpiData = {
    totalActiveCost: 136315.0,
    activeSubscriptions: 6,
    upcomingRenewal: 105180.0,
    costSavingsIdentified: 0,
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Mock subscription data
  const subscriptionData = [
    {
      id: 1,
      subscriptionName: "Example1",
      vendorName: "Test Subscription",
      subscriptionAmount: 10412.0,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      paymentFrequency: "14 Monthly",
      activityStatus: "Active",
    },
    {
      id: 2,
      subscriptionName: "Activity Line console 11223",
      vendorName: "test consolee",
      subscriptionAmount: 8500.0,
      startDate: "2026-02-15",
      endDate: "2027-02-14",
      paymentFrequency: "2 Months",
      activityStatus: "Active",
    },
    {
      id: 3,
      subscriptionName: "now 1234 56565",
      vendorName: "test new 4",
      subscriptionAmount: 12000.0,
      startDate: "2026-03-01",
      endDate: "2027-03-01",
      paymentFrequency: "1 Monthly",
      activityStatus: "Active",
    },
    {
      id: 4,
      subscriptionName: "Subscription Alpha",
      vendorName: "Vendor ABC",
      subscriptionAmount: 15600.0,
      startDate: "2025-12-01",
      endDate: "2026-11-30",
      paymentFrequency: "12 Monthly",
      activityStatus: "Active",
    },
    {
      id: 5,
      subscriptionName: "Beta Service",
      vendorName: "Tech Solutions Inc",
      subscriptionAmount: 9200.0,
      startDate: "2026-01-10",
      endDate: "2026-12-09",
      paymentFrequency: "1 Monthly",
      activityStatus: "Active",
    },
    {
      id: 6,
      subscriptionName: "Gamma Platform",
      vendorName: "Cloud Services",
      subscriptionAmount: 18500.0,
      startDate: "2025-11-15",
      endDate: "2026-11-14",
      paymentFrequency: "12 Monthly",
      activityStatus: "Expired",
    },
    {
      id: 7,
      subscriptionName: "Delta Tools",
      vendorName: "Software Corp",
      subscriptionAmount: 7500.0,
      startDate: "2026-02-20",
      endDate: "2027-02-19",
      paymentFrequency: "1 Monthly",
      activityStatus: "Active",
    },
    {
      id: 8,
      subscriptionName: "Epsilon Suite",
      vendorName: "Enterprise Solutions",
      subscriptionAmount: 22000.0,
      startDate: "2025-10-01",
      endDate: "2026-09-30",
      paymentFrequency: "12 Monthly",
      activityStatus: "Expired",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
          Reports Dashboard
        </h1>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-500">
            {isLoading ? "Loading..." : "Last Update 29 days ago"}
          </span>
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <FiSearch className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Test Subcriptionist Invitation
            </span>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6 sm:gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("standard")}
            className={`pb-3 px-1 text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === "standard"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Standard Reports
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`pb-3 px-1 text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === "financial"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Financial
          </button>
          <button
            onClick={() => setActiveTab("renewal")}
            className={`pb-3 px-1 text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === "renewal"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Renewal and Expiration
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
          <FiFilter className="w-4 h-4" />
          Filters
        </button>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
            <FiUpload className="w-4 h-4" />
            Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1D225D] text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium shadow-sm">
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Standard Reports Tab Content */}
      {activeTab === "standard" &&
        (isLoading ? (
          <div className="space-y-6">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <KPICardSkeleton bgColor="bg-[#D4F1F4]" />
              <KPICardSkeleton bgColor="bg-[#BFF1FF]" />
              <KPICardSkeleton bgColor="bg-[#E1FFBB]" />
              <KPICardSkeleton bgColor="bg-[#CFE1FF]" />
            </div>

            {/* Chart Skeleton */}
            <ChartSkeleton />

            {/* Table Skeleton */}
            <TableSkeleton rows={5} columns={7} showTabs={true} />
          </div>
        ) : (
          <StandardReports
            kpiData={kpiData}
            subscriptionData={subscriptionData}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        ))}

      {/* Financial Tab Content */}
      {activeTab === "financial" &&
        (isLoading ? (
          <div className="space-y-6">
            {/* Top Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <ChartSkeleton className="lg:col-span-3" />
              <ChartSkeleton height="200px" className="lg:col-span-1" />
            </div>

            {/* Line Chart Skeleton */}
            <ChartSkeleton />

            {/* Budget vs Actual Skeleton */}
            <ChartSkeleton />

            {/* Tables Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TableSkeleton rows={4} columns={1} />
              <TableSkeleton rows={4} columns={1} />
            </div>

            {/* Bottom Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <ChartSkeleton className="lg:col-span-3" />
              <ChartSkeleton height="200px" className="lg:col-span-1" />
            </div>
          </div>
        ) : (
          <Financial />
        ))}

      {/* Renewal and Expiration Tab Content */}
      {activeTab === "renewal" &&
        (isLoading ? (
          <div className="space-y-6">
            {/* Calendar Report Skeleton */}
            <ChartSkeleton />

            {/* Renewal Analysis Report Skeleton */}
            <TableSkeleton rows={5} columns={1} />

            {/* Chart Skeleton */}
            <ChartSkeleton />

            {/* Expired Subscription Report Skeleton */}
            <TableSkeleton rows={4} columns={1} />
          </div>
        ) : (
          <RenewalAndExpiration
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        ))}
    </div>
  );
};

export default Report;
