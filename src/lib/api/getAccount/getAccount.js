const GET_CONTACT_BY_B2C_OBJECT_ID_URL =
  "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api/getContactByB2CObjectId";
const API_KEY = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

export async function getContactByB2CObjectId(b2cObjectId) {
  const response = await fetch(GET_CONTACT_BY_B2C_OBJECT_ID_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": API_KEY,
    },
    body: JSON.stringify({ b2cObjectId }),
  });
  const data = await response.json();
  return data;
}
