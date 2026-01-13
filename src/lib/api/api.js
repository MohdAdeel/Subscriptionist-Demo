import axios from "axios";

const API = axios.create({
  baseURL:
    "https://prod-cus-backendapi-fap-development-bug8ecemf4c7fgfz.centralus-01.azurewebsites.net/api",
  headers: {
    "Content-Type": "application/json",
    "x-functions-key":
      "vNPW_oi9emga3XHNrWI7UylbhBCumFuXrSC4wewl2HNaAzFuQ6TsKA==",
  },
});

export default API;
