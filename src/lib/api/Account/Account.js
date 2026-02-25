import API from "../api.js";
import { useAuthStore } from "../../../stores/authStore.js";

export async function populateAccountModal() {
  const contactId = useAuthStore.getState().userAuth?.contactid;
  if (!contactId) {
    console.warn("populateAccountModal: contactId is required (user may not be authenticated)");
    return;
  }
  const { data } = await API.get(`/GetContactDetailsToPopulateOnAccount/${contactId}`);
  return data;
}

export async function getAccountFieldChoices() {
  const { data } = await API.get("/getAccountFieldChoices");
  return data;
}

export async function addAccount(accountData) {
  const { data } = await API.post("/accounts", accountData);
  return data;
}

export async function updateAccount(accountData) {
  const accountid = useAuthStore.getState().userAuth?.accountid;
  const { data } = await API.patch(`/accounts/${accountid}`, accountData);
  return data;
}

export async function activateAccount(body, accountid) {
  const { data } = await API.patch(`/updateToActivateAccount/${accountid}`, body);
  return data;
}

export async function getAccountDetails() {
  const accountid = useAuthStore.getState().userAuth?.accountid;
  const { data } = await API.get(`/getAccountDetails/${accountid}`);
  return data;
}
