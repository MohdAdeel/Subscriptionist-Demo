import API from "../api.js";
import { useAuthStore } from "../../../stores/authStore.js";

export async function getNotifications() {
  const contactId = useAuthStore.getState().userAuth?.contactid;
  const todayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (!contactId) {
    console.warn("getNotifications: contactId is required (user may not be authenticated)");
    return [];
  }
  const response = await API.get(
    `/GetNotificationBellData?contactId=${contactId}&notificationSetting=false&todayDate=${todayDate}`
  );
  return response.data;
}

export async function getNotificationsFromProfilePage() {
  const contactId = useAuthStore.getState().userAuth?.contactid;
  const todayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (!contactId) {
    console.warn("getNotifications: contactId is required (user may not be authenticated)");
    return [];
  }
  const response = await API.get(
    `/GetNotificationBellData?contactId=${contactId}&notificationSetting=true&todayDate=${todayDate}`
  );
  return response.data;
}

export async function dismissNotification(payload) {
  const response = await API.post(`/RemoveNotificationBellData`, payload);
  return response.data;
}
