import API from "../api";

export const getActivity = async () => {
  const { data } = await API.get("/GetActivityLinesByContactId", {
    params: {
      contactId: "030ef119-c1c1-ee11-9079-00224827e8f9",
    },
  });

  return data;
};
