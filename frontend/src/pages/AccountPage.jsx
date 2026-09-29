import { useEffect, useState } from "react";
import { getMyAccount, updateMyAccount } from "../api/mockApi";
import { useRole } from "../context/RoleContext";
import { IconPencil, IconClose } from "../components/Icons";

export default function AccountPage() {
  const { isField } = useRole();

  const [account, setAccount] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [form, setForm] = useState({
    position: "",
    yearsOfExperience: 0,
    directorate: "",
  });

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    try {
      const data = await getMyAccount();
      setAccount(data);
    } catch (error) {
      console.error("Failed to load account:", error);
    }
  }

  function openEdit() {
    setForm({
      position: account.position || "",
      yearsOfExperience: account.yearsOfExperience || 0,
      directorate: account.directorate || "",
    });

    setEditError("");
    setShowEdit(true);
  }

  function closeEdit() {
    if (!saving) {
      setShowEdit(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    setSaving(true);
    setEditError("");

    try {
      const response = await updateMyAccount({
        position: form.position,
        yearsOfExperience: Number(form.yearsOfExperience),
        directorate: form.directorate,
      });
      console.log("UPDATED ACCOUNT:", response);
      setAccount((prev) => ({
        ...prev,
        ...response.account,
      }));

      setShowEdit(false);
    } catch (error) {
      setEditError(error.message || "Failed to update account");
    } finally {
      setSaving(false);
    }
  }

  if (!account) {
    return <div className="loading-hint">Loading account…</div>;
  }

  // const initials = account.name
  //   .split(" ")
  //   .map((p) => p[0])
  //   .join("")
  //   .slice(0, 2)
  //   .toUpperCase();
  const initials = (account.name || account.employeeName || "User")
  .split(" ")
  .map((p) => p[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

  return (
    <>
      <div>
        <div className="view-title">Account</div>

        <div className="view-sub">
          Your engineer profile and activity on NWIS.
        </div>

        <div className="section-card account-card">

          <div className="account-header">

            <div className="account-avatar">
              {initials}
            </div>

            <div className="account-info">

              <div className="account-name-row">
                <div className="account-name">
                  {account.name}
                </div>

                <button
                  className="edit-profile-btn"
                  onClick={openEdit}
                  title="Edit profile"
                  type="button"
                >
                  <IconPencil size={14} />
                </button>
              </div>

              <div className="account-role">
                {account.position || (
                  isField
                    ? "Field Drilling Engineer"
                    : "Office Drilling Analyst"
                )}{" "}
                · Employee ID: {account.employeeId}
              </div>

              <div className="account-role">
                {account.directorate || "Directorate not added"}
              </div>

            </div>
          </div>

          <div className="stat-row">

            <div className="stat-box">
              <div className="num">
                {account.stats.wellsCount}
              </div>
              <div className="lbl">
                Wells Worked On
              </div>
            </div>

            <div className="stat-box">
              <div className="num">
                {account.stats.logsCount}
              </div>
              <div className="lbl">
                Log Entries Submitted
              </div>
            </div>

            <div className="stat-box">
              <div className="num">
                {account.stats.yearsOfService}
              </div>
              <div className="lbl">
                Years of Experience
              </div>
            </div>

          </div>

        </div>
      </div>

      {showEdit && (
        <div
          className="edit-modal-overlay"
          onClick={closeEdit}
        >
          <div
            className="edit-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="edit-modal-header">
              <div>
                <h3>Edit Profile</h3>
                <p>Update your professional details.</p>
              </div>

              <button
                className="modal-close"
                onClick={closeEdit}
                type="button"
              >
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>

              <div className="edit-field">
                <label>Position</label>

                <input
                  type="text"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  placeholder="e.g. Field Drilling Engineer"
                />
              </div>

              <div className="edit-field">
                <label>Years of Experience</label>

                <input
                  type="number"
                  name="yearsOfExperience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  min="0"
                  max="60"
                  placeholder="e.g. 5"
                />
              </div>

              <div className="edit-field">
                <label>Directorate</label>

                <input
                  type="text"
                  name="directorate"
                  value={form.directorate}
                  onChange={handleChange}
                  placeholder="e.g. Drilling Engineering Directorate"
                />
              </div>

              {editError && (
                <div className="edit-error">
                  {editError}
                </div>
              )}

              <div className="edit-modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEdit}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </>
  );
}