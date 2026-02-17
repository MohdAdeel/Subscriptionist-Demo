const baseURL =
  "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
const contactId = "be842fc7-3b07-f111-8407-6045bdd7553a";
const functionsKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";
const accountid = "9df7c78b-0e0c-f111-8406-7ced8dd77286";

export async function populateAccountModal() {
  const response = await fetch(`${baseURL}/GetContactDetailsToPopulateOnAccount/${contactId}`, {
    headers: {
      "x-functions-key": functionsKey,
    },
  });
  return response.json();
}

export async function getAccountFieldChoices() {
  const response = await fetch(`${baseURL}/getAccountFieldChoices`, {
    headers: {
      "x-functions-key": functionsKey,
    },
  });
  return response.json();
}

export async function addAccount(accountData) {
  const response = await fetch(`${baseURL}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": functionsKey,
    },
    body: JSON.stringify(accountData),
  });
  return response.json();
}

export async function updateAccount(accountData) {
  const response = await fetch(`${baseURL}/accounts/${accountid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": functionsKey,
    },
    body: JSON.stringify(accountData),
  });
  return response.json();
}

export async function activateAccount(body) {
  const response = await fetch(`${baseURL}/updateToActivateAccount/${accountid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": functionsKey,
    },
    body: JSON.stringify(body),
  });
  return response.json();
}
