import API from "../api.js";

export async function getContactByB2CObjectId(b2cObjectId) {
  if (!b2cObjectId) {
    console.warn("Func: getContactByB2CObjectId: b2cObjectId is required");
    return;
  }
  const { data } = await API.post("/getContactByB2CObjectId", { b2cObjectId });
  return data;
}
