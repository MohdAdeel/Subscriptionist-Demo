const baseURL =
  "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api";
const contactId = "be842fc7-3b07-f111-8407-6045bdd7553a";
const functionsKey = "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==";

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
  const data = await response.json();
  return data;
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

export async function activateAccount(body, accountid) {
  console.log("here is the accountid", accountid);
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
