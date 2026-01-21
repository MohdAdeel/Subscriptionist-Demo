import API from "../api";
import { handleActivityLinesSuccess } from "../../utils/reportsPage";

export const getActivity = async () => {
  const { data } = await API.get("/GetActivityLinesByContactId", {
    params: {
      contactId: "030ef119-c1c1-ee11-9079-00224827e8f9",
    },
  });
  handleActivityLinesSuccess(data);
  return data;
};
