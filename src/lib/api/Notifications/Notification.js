import API from "../api.js";
import { useAuthStore } from "../../../stores/authStore.js";

export async function getNotifications() {
  const contactId = useAuthStore.getState().userAuth?.contactid;
  if (!contactId) {
    console.warn("getNotifications: contactId is required (user may not be authenticated)");
    return [];
  }
  const response = await API.get(
    `/GetNotificationBellData?contactId=${contactId}&decrementDays=false`
  );
  return response.data;
}

export async function dismissNotification(payload) {
  const response = await API.post(`/RemoveNotificationBellData`, payload);
  return response.data;
}
