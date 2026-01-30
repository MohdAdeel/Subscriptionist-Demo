import { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import {
  getContactById,
  updateContact,
  addAssociateUser,
  getNotificationData,
  ContactDeleteConfirmed,
  callGetAssociatedUsers,
} from "../../lib/utils/subscriptions";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const [notification, setNotification] = useState(null);
  const [associatedUsers, setAssociatedUsers] = useState([]);
  const [contact, setContact] = useState({
    firstname: "",
    lastname: "",
    emailaddress1: "",
    accountrolecode: "",
    telephone1: "",
    adx_organizationname: "",
    websiteurl: "",
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
  });

  async function handleAddAssociateUser() {
    try {
      if (!newUser.firstname || !newUser.lastname || !newUser.email) {
        console.error("❌ All fields are required");
        return;
      }
      const userData = {
        firstname: newUser?.firstname,
        lastname: newUser?.lastname,
        email: newUser?.email,
      };

      const result = await addAssociateUser(userData);

      console.log("✅ User added successfully:", result);
    } catch (error) {
      if (error instanceof Error) {
        console.error("❌ API Error:", error.message);
      } else {
        console.error("❌ Unknown Error:", error);
      }
    }
  }

  useEffect(() => {
    const fetchAssociatedUsers = async () => {
      try {
        const response = await callGetAssociatedUsers();

        const users = response?.value?.map((item) => ({
          id: item.record2id_contact?.contactid,
          name: item.record2id_contact?.fullname,
          email: item.record2id_contact?.emailaddress1,
        }));

        setAssociatedUsers(users || []);
      } catch (error) {
        console.error("Failed to load associated users", error);
      }
    };

    fetchAssociatedUsers();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const notificationRes = await getNotificationData();
        console.log("Notification Data:", notificationRes);

        if (notificationRes?.value?.length > 0) {
          setNotification(notificationRes.value[0]);
        }

        const contactRes = await getContactById();
        if (contactRes?.value?.length > 0) {
          setContact(contactRes.value[0]);
        }
      } catch (err) {
        console.error("Profile Page API Error:", err);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    if (activeTab !== "personal") return;

    const payload = {};

    if (contact.firstname) payload.firstname = contact.firstname;
    if (contact.lastname) payload.lastname = contact.lastname;
    if (contact.emailaddress1) payload.emailaddress1 = contact.emailaddress1;
    if (contact.telephone1) payload.telephone1 = contact.telephone1;
    if (contact.adx_organizationname) payload.adx_organizationname = contact.adx_organizationname;
    if (contact.websiteurl) payload.websiteurl = contact.websiteurl;

    // ⚠️ CRM OPTION SET — MUST BE NUMBER > 0
    if (contact.accountrolecode !== "") {
      payload.accountrolecode = Number(contact.accountrolecode);
    }

    console.log("PATCH PAYLOAD 👉", payload);

    try {
      await updateContact(payload);
      alert("Profile updated successfully ✅");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update profile ❌");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteUser = async (userId) => {
    // Step 1: confirm
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      // Step 2: call API
      await ContactDeleteConfirmed();

      // Step 3: remove user from state
      setAssociatedUsers((prev) => prev.filter((user) => user.id !== userId));

      alert("User deleted successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user ❌");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5FB] p-4 sm:p-6 lg:p-8">
      <PageHeader
        variant="reports"
        title="Profile Settings"
        lastUpdatedText="Last Update 19 hours ago"
        invitationLabel="Test Subcriptionist Invitation"
      />

      <div className="bg-white rounded-3xl shadow-sm max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-100 px-6 sm:px-10 pt-6">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-0 sm:px-4 pb-3 mr-6 text-sm sm:text-base font-semibold ${
              activeTab === "personal"
                ? "text-[#1D225D] border-b-2 border-[#1D225D]"
                : "text-gray-500 hover:text-[#1D225D]"
            }`}
          >
            Personal Information
          </button>

          <button
            onClick={() => setActiveTab("notification")}
            className={`px-0 sm:px-4 pb-3 mr-6 text-sm sm:text-base font-semibold ${
              activeTab === "notification"
                ? "text-[#1D225D] border-b-2 border-[#1D225D]"
                : "text-gray-500 hover:text-[#1D225D]"
            }`}
          >
            Notification Settings
          </button>

          <button
            onClick={() => setActiveTab("associated")}
            className={`px-0 sm:px-4 pb-3 text-sm sm:text-base font-semibold ${
              activeTab === "associated"
                ? "text-[#1D225D] border-b-2 border-[#1D225D]"
                : "text-gray-500 hover:text-[#1D225D]"
            }`}
          >
            Associated Users
          </button>

          <div className="ml-auto mt-3 sm:mt-0">
            <button className="px-4 py-2 rounded-lg bg-[#1D225D] text-white text-sm font-semibold">
              Reset Password
            </button>
          </div>
        </div>

        {/* ================= PERSONAL INFORMATION ================= */}
        {activeTab === "personal" && (
          <div className="px-6 py-8 space-y-10">
            <section className="space-y-4">
              <h3 className="font-semibold text-[#1D225D]">Main Information</h3>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  ["First Name", "firstname"],
                  ["Last Name", "lastname"],
                  ["E-mail", "emailaddress1"],
                ].map(([label, name]) => (
                  <div key={name}>
                    <label className="text-xs">{label}</label>
                    <input
                      name={name}
                      value={contact[name] || ""}
                      onChange={handleChange}
                      className="w-full h-10 border rounded px-3"
                    />
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs">Role</label>
                  <input
                    name="accountrolecode"
                    value={contact.accountrolecode || ""}
                    onChange={handleChange}
                    className="w-full h-10 border rounded px-3"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold text-[#1D225D]">Additional Information</h3>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  ["Business Phone", "telephone1"],
                  ["Organization Name", "adx_organizationname"],
                  ["Website", "websiteurl"],
                ].map(([label, name]) => (
                  <div key={name}>
                    <label className="text-xs">{label}</label>
                    <input
                      name={name}
                      value={contact[name] || ""}
                      onChange={handleChange}
                      className="w-full h-10 border rounded px-3"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ================= NOTIFICATION SETTINGS ================= */}
        {activeTab === "notification" && notification && (
          <div className="px-6 sm:px-10 py-10 space-y-10">
            {/* Email Notifications */}
            <section className="grid md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-sm font-semibold text-[#1D225D] mb-1">Email Notifications</h3>
                <p className="text-xs text-gray-500">
                  Receive emails to stay informed about your subscriptions and renewals.
                </p>
              </div>

              <div className="space-y-6">
                <ToggleRow
                  title="Subscription Expiration Reminder"
                  desc="Get notified before your subscription expires."
                  dropdown
                  value={notification.yiic_emaildaysforreminder}
                  options={[7, 15, 30]}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_emaildaysforreminder: val,
                    }))
                  }
                />

                <ToggleRow
                  title="Plan Change Confirmation"
                  desc="Be notified when your subscription plan changes."
                  value={notification.yiic_emailplanchangeconfirmation}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_emailplanchangeconfirmation: val,
                    }))
                  }
                />

                <ToggleRow
                  title="Important Policy Updates"
                  desc="Stay informed about important platform changes."
                  value={notification.yiic_emailimportantpolicyupdate}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_emailimportantpolicyupdate: val,
                    }))
                  }
                />

                <ToggleRow
                  title="Subscription Cancelled"
                  desc="Receive notifications when subscription is cancelled."
                  value={notification.yiic_emailsubscriptioncancelled}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_emailsubscriptioncancelled: val,
                    }))
                  }
                />
              </div>
            </section>

            {/* Push Notifications */}
            <section className="grid md:grid-cols-2 gap-10 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-[#1D225D] mb-1">Push Notifications</h3>
                <p className="text-xs text-gray-500">
                  Receive push notifications when you are online.
                </p>
              </div>

              <div className="space-y-6">
                <ToggleRow
                  title="Subscription Expiration Reminder"
                  dropdown
                  value={notification.yiic_daysforreminder}
                  options={[7, 15, 30]}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_daysforreminder: val,
                    }))
                  }
                />

                <ToggleRow
                  title="Plan Change Confirmation"
                  value={notification.yiic_planchangeconfirmation}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_planchangeconfirmation: val,
                    }))
                  }
                />

                <ToggleRow
                  title="Important Policy Updates"
                  value={notification.yiic_importantpolicyupdate}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_importantpolicyupdate: val,
                    }))
                  }
                />

                <ToggleRow
                  title="Subscription Cancelled"
                  value={notification.yiic_subscriptioncancelled}
                  onChange={(val) =>
                    setNotification((p) => ({
                      ...p,
                      yiic_subscriptioncancelled: val,
                    }))
                  }
                />
              </div>
            </section>
          </div>
        )}

        {activeTab === "associated" && (
          <div className="px-6 sm:px-10 py-10">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-semibold text-[#1D225D] pb-3">
                      Full Name
                    </th>
                    <th className="text-left text-sm font-semibold text-[#1D225D] pb-3">Email</th>
                    <th className="text-right text-sm font-semibold text-[#1D225D] pb-3">Delete</th>
                  </tr>
                </thead>

                <tbody>
                  {associatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 last:border-none">
                      <td className="py-4 text-sm text-gray-800">{user.name}</td>

                      <td className="py-4 text-sm">
                        <a href={`mailto:${user.email}`} className="text-[#4F46E5] hover:underline">
                          {user.email}
                        </a>
                      </td>

                      <td className="py-4 text-right">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-4">
                <button
                  className="px-6 py-2.5 rounded-lg bg-[#1D225D] text-white text-sm font-semibold"
                  onClick={() => setShowAddUserModal(true)}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddUserModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
              <h3 className="text-lg font-semibold mb-4">Add New User</h3>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter First Name"
                  value={newUser.firstname}
                  onChange={(e) => setNewUser({ ...newUser, firstname: e.target.value })}
                  className="w-full h-10 border rounded px-3"
                />
                <input
                  type="text"
                  placeholder="Enter Last Name"
                  value={newUser.lastname}
                  onChange={(e) => setNewUser({ ...newUser, lastname: e.target.value })}
                  className="w-full h-10 border rounded px-3"
                />
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full h-10 border rounded px-3"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="px-6 py-2.5 rounded-lg bg-[#1D225D] text-white text-sm font-semibold"
                  onClick={() => {
                    // Temporary: just add to state, backend API call later
                    setAssociatedUsers((prev) => [...prev, { id: Date.now(), ...newUser }]);
                    setNewUser({ firstname: "", lastname: "", email: "" });
                    setShowAddUserModal(false);
                    handleAddAssociateUser();
                  }}
                >
                  Add
                </button>
              </div>

              {/* Close Icon */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowAddUserModal(false)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 sm:px-10 pb-6 border-t border-gray-100 pt-4">
          <button className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg bg-[#1D225D] text-white text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= Toggle Component ================= */

function ToggleRow({ title, desc, dropdown, value, options = [], onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h4 className="text-sm font-semibold text-[#1D225D]">{title}</h4>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>

      <div className="flex items-center gap-3">
        {dropdown && (
          <select
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-8 rounded-md border border-gray-200 text-xs px-2"
          >
            {options.map((op) => (
              <option key={op} value={op}>
                {op} days
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => onChange(!value)}
          className={`w-11 h-6 rounded-full transition ${value ? "bg-[#1D225D]" : "bg-gray-300"}`}
        >
          <span
            className={`block w-5 h-5 bg-white rounded-full transform transition ${
              value ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
