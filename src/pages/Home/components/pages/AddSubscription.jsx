import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ACTIVITY_LINES_QUERY_KEY } from "../../../../hooks/useActivityLines";
import AddSubscriptionModalFromFlow from "../Models/AddSubscriptionModalFromFlow";

export default function AddSubscription() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const handleAddSubscriptions = () => {
    setModalOpen(true);
  };

  const handleAddSuccess = () => {
    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ACTIVITY_LINES_QUERY_KEY });
  };

  return (
    <div className="w-full min-h-[calc(90vh-12rem)] flex flex-col items-center justify-center rounded-2xl bg-white border border-[#EEF2F6] shadow-sm">
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#F3F6F9] shadow-sm">
          <svg
            className="h-12 w-12 text-[#4B5563]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden
          >
            {/* Stack of documents with three dots each */}
            <rect
              x="4"
              y="3"
              width="12"
              height="5"
              rx="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6.5" cy="5.5" r="1" fill="currentColor" />
            <circle cx="10" cy="5.5" r="1" fill="currentColor" />
            <circle cx="13.5" cy="5.5" r="1" fill="currentColor" />
            <rect
              x="4"
              y="9"
              width="12"
              height="5"
              rx="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6.5" cy="11.5" r="1" fill="currentColor" />
            <circle cx="10" cy="11.5" r="1" fill="currentColor" />
            <circle cx="13.5" cy="11.5" r="1" fill="currentColor" />
            <rect
              x="4"
              y="15"
              width="12"
              height="5"
              rx="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6.5" cy="17.5" r="1" fill="currentColor" />
            <circle cx="10" cy="17.5" r="1" fill="currentColor" />
            <circle cx="13.5" cy="17.5" r="1" fill="currentColor" />
            {/* Magnifying glass overlapping top-right */}
            <circle cx="16" cy="6" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.2 8.2l2.3 2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#1F2937]">Add Subscriptions</h2>
          <p className="text-sm font-normal text-[#4B5563] max-w-sm">
            You need to add Subscription to start managing activities.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddSubscriptions}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3730A3] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2d2880] focus:outline-none focus:ring-2 focus:ring-[#3730A3] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#3730A3]"
        >
          <span className="text-lg leading-none">+</span>
          Add Subscriptions
        </button>
      </div>

      <AddSubscriptionModalFromFlow
        open={modalOpen}
        setOpen={setModalOpen}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
}
