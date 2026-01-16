import React from "react";

/**
 * SkeletonLoader - A flexible skeleton loading component using only Tailwind CSS
 *
 * @param {string} variant - Type of skeleton: 'card', 'kpiCard', 'chart', 'table', 'tableRow', 'tableHeader', 'input', 'button', 'text', 'circle', 'rectangle'
 * @param {string} className - Additional Tailwind classes
 * @param {number} count - Number of skeleton items to render (for repeating elements)
 * @param {object} props - Additional props passed to the skeleton element
 */

// Base skeleton element with pulse animation
const BaseSkeleton = ({ className = "", ...props }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    {...props}
  />
);

// KPI Card Skeleton
export const KPICardSkeleton = ({
  bgColor = "bg-gray-50",
  className = "",
  count = 1,
  ...props
}) => {
  const cards = Array.from({ length: count }).map((_, idx) => (
    <div
      key={idx}
      className={`${bgColor} rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 animate-pulse ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-white/80 rounded-lg"></div>
        <div className="w-6 h-6 bg-white/80 rounded-full"></div>
      </div>
      <div className="h-4 bg-white/80 rounded w-28 mb-2"></div>
      <div className="h-9 bg-white/80 rounded w-36"></div>
    </div>
  ));

  return <>{cards}</>;
};

// Generic Card Skeleton
export const CardSkeleton = ({
  bgColor,
  className = "",
  showDropdown = false,
  ...props
}) => {
  const skeletonBaseColor = bgColor ? "bg-white/60" : "bg-gray-300";

  return (
    <div
      className={`rounded-xl p-4 flex flex-col justify-between ${
        bgColor ? "" : "bg-gray-50"
      } ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : {}}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 ${skeletonBaseColor} rounded animate-pulse`}
          ></div>
          <div
            className={`h-4 w-24 ${skeletonBaseColor} rounded animate-pulse`}
          ></div>
        </div>
        <div
          className={`w-4 h-4 ${skeletonBaseColor} rounded animate-pulse`}
        ></div>
      </div>
      {showDropdown && (
        <div
          className={`h-6 w-20 ${skeletonBaseColor} rounded mt-2 animate-pulse`}
        ></div>
      )}
      <div className="mt-3">
        <div
          className={`h-8 w-16 ${skeletonBaseColor} rounded animate-pulse`}
        ></div>
      </div>
    </div>
  );
};

// Chart Skeleton
export const ChartSkeleton = ({
  height = "300px",
  showHeader = true,
  showControls = false,
  className = "",
  ...props
}) => (
  <div
    className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 ${className}`}
    {...props}
  >
    {showHeader && (
      <div className="h-6 bg-gray-200 rounded w-48 mb-4 sm:mb-6 animate-pulse"></div>
    )}
    {showControls && (
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    )}
    <div className="bg-gray-200 rounded animate-pulse" style={{ height }}></div>
  </div>
);

// Table Skeleton
export const TableSkeleton = ({
  rows = 5,
  columns = 7,
  showTabs = false,
  className = "",
  ...props
}) => (
  <div
    className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse ${className}`}
    {...props}
  >
    {showTabs && (
      <div className="border-b border-gray-200 px-4 sm:px-6 pt-4 pb-3">
        <div className="flex gap-6 sm:gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-4 bg-gray-200 rounded w-32"></div>
          ))}
        </div>
      </div>
    )}
    <div className="px-4 sm:px-6 py-4 space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="h-4 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Table Row Skeleton (for table headers)
export const TableRowSkeleton = ({ columns = 5, className = "", ...props }) => (
  <div
    className={`grid items-center gap-3 min-h-[52px] py-2.5 ${className}`}
    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    {...props}
  >
    {Array.from({ length: columns }).map((_, idx) => (
      <span
        key={idx}
        className="h-3.5 rounded-md bg-gray-200 animate-pulse"
        style={{
          width:
            idx === 0 || idx === columns - 1
              ? "60%"
              : idx === 2
              ? "90%"
              : "100%",
        }}
      ></span>
    ))}
  </div>
);

// Table Header Skeleton
export const TableHeaderSkeleton = ({
  columns = 10,
  className = "",
  ...props
}) => (
  <thead
    className={`bg-[#f3f4fa] relative overflow-hidden ${className}`}
    {...props}
  >
    <tr>
      {Array.from({ length: columns }).map((_, idx) => (
        <th
          key={idx}
          className="text-left text-[13px] font-semibold text-[#1d225d] p-3 bg-[#f3f4fa] relative z-[3]"
        >
          <span className="inline-block h-3.5 w-4/5 rounded bg-gray-200 animate-pulse"></span>
        </th>
      ))}
    </tr>
  </thead>
);

// Input Skeleton
export const InputSkeleton = ({
  showLabel = true,
  className = "",
  ...props
}) => (
  <div
    className={`flex flex-col gap-1.5 flex-1 min-w-[150px] ${className}`}
    {...props}
  >
    {showLabel && (
      <div className="h-[13px] w-20 rounded bg-gray-200 animate-pulse"></div>
    )}
    <div className="h-10 w-4/5 min-w-[100px] rounded-lg bg-gray-200 animate-pulse"></div>
  </div>
);

// Button Skeleton
export const ButtonSkeleton = ({
  width = "140px",
  height = "42px",
  count = 1,
  className = "",
  ...props
}) => {
  const buttons = Array.from({ length: count }).map((_, idx) => (
    <div
      key={idx}
      className={`bg-gray-200 animate-pulse rounded-[10px] flex-shrink-0 ${className}`}
      style={{ width, height }}
      {...props}
    />
  ));

  return <>{buttons}</>;
};

// Text Skeleton
export const TextSkeleton = ({
  width = "100%",
  height = "16px",
  count = 1,
  className = "",
  ...props
}) => {
  const texts = Array.from({ length: count }).map((_, idx) => (
    <div
      key={idx}
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      style={{ width, height }}
      {...props}
    />
  ));

  return <>{texts}</>;
};

// Circle Skeleton
export const CircleSkeleton = ({ size = "32px", className = "", ...props }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded-full ${className}`}
    style={{ width: size, height: size }}
    {...props}
  />
);

// Rectangle Skeleton
export const RectangleSkeleton = ({
  width = "100%",
  height = "100px",
  className = "",
  ...props
}) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height }}
    {...props}
  />
);

// Main SkeletonLoader component with variant prop
const SkeletonLoader = ({
  variant = "text",
  count = 1,
  className = "",
  ...props
}) => {
  switch (variant) {
    case "kpiCard":
      return <KPICardSkeleton count={count} className={className} {...props} />;
    case "card":
      return <CardSkeleton className={className} {...props} />;
    case "chart":
      return <ChartSkeleton className={className} {...props} />;
    case "table":
      return <TableSkeleton className={className} {...props} />;
    case "tableRow":
      return <TableRowSkeleton className={className} {...props} />;
    case "tableHeader":
      return <TableHeaderSkeleton className={className} {...props} />;
    case "input":
      return <InputSkeleton className={className} {...props} />;
    case "button":
      return <ButtonSkeleton count={count} className={className} {...props} />;
    case "text":
      return <TextSkeleton count={count} className={className} {...props} />;
    case "circle":
      return <CircleSkeleton className={className} {...props} />;
    case "rectangle":
      return <RectangleSkeleton className={className} {...props} />;
    default:
      return <BaseSkeleton className={className} {...props} />;
  }
};

export default SkeletonLoader;

// Named exports for convenience
export { SkeletonLoader, BaseSkeleton };
