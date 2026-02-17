import React from "react";
import { RectangleSkeleton } from "../../../../components/SkeletonLoader";

const ChartCardSkeleton = ({ variant = "bar" }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6] h-full min-h-[240px] flex flex-col">
    <div className="display: flex items-center justify-between mb-4">
      <RectangleSkeleton width="8rem" height="1rem" className="rounded" />
      <RectangleSkeleton width="3rem" height="1rem" className="rounded" />
    </div>
    <div className="flex-1 min-h-[160px] flex items-end gap-2">
      {variant === "line" ? (
        <div className="h-full w-full rounded-lg bg-gray-200 animate-pulse" />
      ) : variant === "doughnut" ? (
        <div className="flex-1 min-h-[160px] flex items-center gap-4">
          <div className="h-32 w-32 shrink-0 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            {["60%", "80%", "70%", "90%"].map((w, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-gray-200 animate-pulse" />
                <RectangleSkeleton width={w} height="12px" className="rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        [35, 60, 55, 72, 50, 66].map((h, idx) => (
          <div
            key={idx}
            className="flex-1 rounded-md bg-gray-200 animate-pulse min-w-[16px]"
            style={{ height: `${h}%` }}
          />
        ))
      )}
    </div>
  </div>
);

const TaskCardSkeleton = () => (
  <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#EEF2F6]">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-gray-200 animate-pulse shrink-0" />
      <RectangleSkeleton width="8rem" height="1rem" className="rounded" />
    </div>
    <div className="mt-3 divide-y divide-gray-100">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between gap-3 py-2 ${idx === 0 ? "pt-0" : ""}`}
        >
          <RectangleSkeleton width="14rem" height="0.75rem" className="rounded flex-shrink-0" />
          <div className="flex items-center gap-3 flex-shrink-0">
            <RectangleSkeleton width="4rem" height="1rem" className="rounded-full" />
            <RectangleSkeleton width="5rem" height="1rem" className="rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function DashboardSkeletonLoader() {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCardSkeleton variant="doughnut" />
        <ChartCardSkeleton variant="line" />
        <ChartCardSkeleton variant="bar" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCardSkeleton variant="bar" />
        <ChartCardSkeleton variant="bar" />
        <ChartCardSkeleton variant="bar" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </>
  );
}
