/**
 * Counts subscriptions by vendor name
 * Accepts either { lines: [...] } or grouped array [[...], [...]]
 */
export function countByVendorName(data) {
  const result = {};

  if (!data) return [];

  // Handle grouped array format (array of arrays)
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    data.forEach((subArray) => {
      subArray.forEach((subscription) => {
        if (subscription?.status === 0 && subscription?.VendorName) {
          result[subscription.VendorName] =
            (result[subscription.VendorName] || 0) + 1;
        }
      });
    });
  }
  // Handle object with lines property
  else if (data.lines && Array.isArray(data.lines)) {
    data.lines.forEach((subscription) => {
      if (subscription?.status === 0 && subscription?.VendorName) {
        result[subscription.VendorName] =
          (result[subscription.VendorName] || 0) + 1;
      }
    });
  }

  return Object.keys(result).map((vendorName) => ({
    vendor: vendorName,
    count: result[vendorName],
  }));
}
