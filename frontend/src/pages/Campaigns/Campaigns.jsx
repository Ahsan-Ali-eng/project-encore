import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

import { apiRequest } from "../../services/api";

const campaignTypes = [
  {
    value: "FOLLOW_UP",
    label: "Follow-up",
    description: "Follow up with customers after a purchase or service.",
  },
  {
    value: "PROMOTION",
    label: "Promotion / Deal",
    description: "Send offers like 10% off or seasonal promotions.",
  },
  {
    value: "SERVICE_REMINDER",
    label: "Service Reminder",
    description: "Remind customers when they are due for another service.",
  },
  {
    value: "REVIEW_REQUEST",
    label: "Review Request",
    description: "Ask customers to leave a review after their experience.",
  },
  {
    value: "RE_ENGAGEMENT",
    label: "Re-engagement",
    description: "Bring back customers who haven't returned recently.",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    description: "Create your own campaign and message.",
  },
];

const channels = [
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "BOTH", label: "SMS + Email" },
];

const triggerTypes = [
  { value: "MANUAL", label: "Manual" },
  { value: "AFTER_PURCHASE", label: "After Purchase" },
  { value: "AFTER_SERVICE", label: "After Service" },
  { value: "DAYS_AFTER_EVENT", label: "Days After Event" },
  { value: "SERVICE_DUE", label: "When Service Is Due" },
  { value: "SCHEDULED", label: "Scheduled" },
];

const campaignStatuses = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ARCHIVED", label: "Archived" },
];

function getCampaignTypeLabel(type) {
  return (
    campaignTypes.find((item) => item.value === type)?.label ||
    type
  );
}

function getChannelLabel(channel) {
  return (
    channels.find((item) => item.value === channel)?.label ||
    channel
  );
}

function formatDateForInput(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().split("T")[0];
}

export default function Campaigns() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignToDelete, setCampaignToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "FOLLOW_UP",
    channel: "SMS",
    triggerType: "MANUAL",
    delayDays: 0,
    offerText: "",
    offerExpiresAt: "",
    serviceName: "",
    reminderDaysBefore: 0,
    messageTemplate: "",
    emailSubject: "",
    emailBody: "",
    status: "DRAFT",
  });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function loadCampaigns() {
      try {
        setError("");

        const token = await getToken();

        const [campaignData, customerData] = await Promise.all([
  apiRequest("/campaigns", {}, token),
  apiRequest("/customers", {}, token),
]);

setCampaigns(campaignData);
setCustomers(customerData);


      } catch (error) {
        console.error("Failed to load campaigns:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadCampaigns();
  }, [isLoaded, isSignedIn, getToken]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
  setFormData({
    name: "",
    description: "",
    type: "FOLLOW_UP",
    channel: "SMS",
    triggerType: "MANUAL",
    delayDays: 0,
    offerText: "",
    offerExpiresAt: "",
    serviceName: "",
    reminderDaysBefore: 0,
    messageTemplate: "",
    emailSubject: "",
    emailBody: "",
    status: "DRAFT",
  });

  setSelectedCustomerIds([]);
}

  function openCreateModal() {
    setError("");
    setEditingCampaign(null);
    resetForm();
    setIsModalOpen(true);
  }

  async function openEditModal(campaign) {
    setError("");
    setEditingCampaign(campaign);

    setFormData({
      name: campaign.name || "",
      description: campaign.description || "",
      type: campaign.type || "FOLLOW_UP",
      channel: campaign.channel || "SMS",
      triggerType: campaign.triggerType || "MANUAL",
      delayDays: campaign.delayDays || 0,
      offerText: campaign.offerText || "",
      offerExpiresAt: formatDateForInput(campaign.offerExpiresAt),
      serviceName: campaign.serviceName || "",
      reminderDaysBefore: campaign.reminderDaysBefore || 0,
      messageTemplate: campaign.messageTemplate || "",
      emailSubject: campaign.emailSubject || "",
      emailBody: campaign.emailBody || "",
      status: campaign.status || "DRAFT",
    });

        try {
      const token = await getToken();

      const recipients = await apiRequest(
        `/campaigns/${campaign.id}/recipients`,
        {},
        token
      );

      setSelectedCustomerIds(
        recipients.map((recipient) => recipient.customerId)
      );
    } catch (error) {
      console.error("Failed to load campaign recipients:", error);
      setSelectedCustomerIds([]);
      setError(error.message);
    }

    setIsModalOpen(true);
  }

  function closeCreateModal() {
    if (!isSaving) {
      setIsModalOpen(false);
      setEditingCampaign(null);
      resetForm();
    }
  }

  function openDeleteModal(campaign) {
    setError("");
    setCampaignToDelete(campaign);
  }

  function closeDeleteModal() {
    if (!isDeleting) {
      setCampaignToDelete(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setIsSaving(true);

      const token = await getToken();

      let savedCampaign;

      const payload = {
        ...formData,
        delayDays: Number(formData.delayDays),
        reminderDaysBefore: Number(formData.reminderDaysBefore),
      };

      if (editingCampaign) {
        const updatedCampaign = await apiRequest(
          `/campaigns/${editingCampaign.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
          token
        );

        savedCampaign = updatedCampaign;

        setCampaigns((previous) =>
          previous.map((campaign) =>
            campaign.id === updatedCampaign.id
              ? updatedCampaign
              : campaign
          )
        );
      } else {
        const newCampaign = await apiRequest(
          "/campaigns",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          token
        );

        savedCampaign = newCampaign;

        setCampaigns((previous) => [
          newCampaign,
          ...previous,
        ]);
      }

      await apiRequest(
  `/campaigns/${savedCampaign.id}/recipients`,
  {
    method: "PUT",
    body: JSON.stringify({
      customerIds: selectedCustomerIds,
    }),
  },
  token
);

      setIsModalOpen(false);
      setEditingCampaign(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save campaign:", error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!campaignToDelete) {
      return;
    }

    try {
      setError("");
      setIsDeleting(true);

      const token = await getToken();

      await apiRequest(
        `/campaigns/${campaignToDelete.id}`,
        {
          method: "DELETE",
        },
        token
      );

      setCampaigns((previous) =>
        previous.filter(
          (campaign) => campaign.id !== campaignToDelete.id
        )
      );

      setCampaignToDelete(null);
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <h2 className="text-3xl font-bold text-encore-text">
            Campaigns
          </h2>

          <p className="mt-2 text-encore-text-secondary">
            Create and manage customer follow-up campaigns.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full md:w-auto bg-encore-primary px-5 py-3 rounded-lg text-white font-semibold hover:bg-encore-primary-hover transition"
        >
          + Create Campaign
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-4">

        {isLoading ? (
          <div className="bg-encore-surface border border-encore-border rounded-2xl p-12 text-center">

            <p className="text-encore-text-secondary">
              Loading campaigns...
            </p>

          </div>

        ) : campaigns.length === 0 ? (

          <div className="bg-encore-surface border border-encore-border rounded-2xl p-12 text-center">

            <h3 className="text-xl font-semibold text-encore-text">
              No campaigns yet
            </h3>

            <p className="mt-2 text-encore-text-secondary">
              Create your first campaign to start engaging your customers.
            </p>

            <button
              onClick={openCreateModal}
              className="mt-6 bg-encore-primary px-5 py-3 rounded-lg text-white font-semibold hover:bg-encore-primary-hover transition"
            >
              + Create Campaign
            </button>

          </div>

        ) : (

          campaigns.map((campaign) => (

            <div
              key={campaign.id}
              className="bg-encore-surface border border-encore-border rounded-2xl p-6"
            >

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                <div className="flex-1">

                  <h3 className="text-xl font-semibold text-encore-text">
                    {campaign.name}
                  </h3>

                  {campaign.description && (
                    <p className="mt-2 text-encore-text-secondary">
                      {campaign.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">

                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                      {getCampaignTypeLabel(campaign.type)}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
                      {getChannelLabel(campaign.channel)}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-300 text-xs font-medium">
                      {campaign.status}
                    </span>

                  </div>

                </div>

                <div className="flex flex-col items-start lg:items-end gap-4">

                  <div className="text-left lg:text-right">

                    <p className="text-sm text-encore-text-muted">
                      Trigger
                    </p>

                    <p className="mt-1 text-encore-text-secondary">
                      {triggerTypes.find(
                        (trigger) =>
                          trigger.value === campaign.triggerType
                      )?.label || campaign.triggerType}
                    </p>

                  </div>

                  <div className="flex items-center gap-4">

                    <button
                      onClick={() => openEditModal(campaign)}
                      className="text-blue-400 hover:text-blue-300 transition font-medium"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => openDeleteModal(campaign)}
                      className="text-red-400 hover:text-red-300 transition font-medium"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

      {/* Create / Edit Campaign Modal */}
      {isModalOpen && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 py-8 z-50 overflow-y-auto">

          <div className="w-full max-w-2xl bg-encore-surface border border-encore-border rounded-2xl p-8 my-auto">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h3 className="text-2xl font-bold text-encore-text">
                  {editingCampaign
                    ? "Edit Campaign"
                    : "Create Campaign"}
                </h3>

                <p className="mt-1 text-sm text-encore-text-muted">
                  {editingCampaign
                    ? "Update your campaign settings."
                    : "Build a campaign for your customers."
                  }
                </p>

              </div>

              <button
                onClick={closeCreateModal}
                className="text-encore-text-muted hover:text-encore-text text-2xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* Campaign Name */}
              <div>

                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Campaign Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="10% Off Your Next Visit"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />

              </div>

              {/* Description */}
              <div>

                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="A short description of what this campaign does."
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />

              </div>

              {/* Type */}
              <div>

                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Campaign Type
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                >

                  {campaignTypes.map((type) => (

                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>

                  ))}

                </select>

              </div>

              {/* Channel */}
              <div>

                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Channel
                </label>

                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                >

                  {channels.map((channel) => (

                    <option
                      key={channel.value}
                      value={channel.value}
                    >
                      {channel.label}
                    </option>

                  ))}

                </select>

              </div>

              {/* Trigger */}
              <div>

                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Trigger
                </label>

                <select
                  name="triggerType"
                  value={formData.triggerType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                >

                  {triggerTypes.map((trigger) => (

                    <option
                      key={trigger.value}
                      value={trigger.value}
                    >
                      {trigger.label}
                    </option>

                  ))}

                </select>

              </div>

              {/* Status - Edit only */}
              {editingCampaign && (

                <div>

                  <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                    Campaign Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  >

                    {campaignStatuses.map((status) => (

                      <option
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </option>

                    ))}

                  </select>

                </div>

              )}

              {/* Delay */}
              {formData.triggerType === "DAYS_AFTER_EVENT" && (

                <div>

                  <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                    Delay in Days
                  </label>

                  <input
                    type="number"
                    name="delayDays"
                    value={formData.delayDays}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  />

                </div>

              )}

              {/* Promotion */}
              {formData.type === "PROMOTION" && (

                <div className="space-y-5 p-5 rounded-xl bg-encore-background border border-encore-border">

                  <div>

                    <h4 className="font-semibold text-encore-text">
                      Promotion Details
                    </h4>

                    <p className="mt-1 text-sm text-encore-text-muted">
                      Configure the offer you'll send to customers.
                    </p>

                  </div>

                  <div>

                    <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                      Offer
                    </label>

                    <input
                      type="text"
                      name="offerText"
                      value={formData.offerText}
                      onChange={handleChange}
                      placeholder="Get 10% off your next visit"
                      className="w-full px-4 py-3 rounded-lg bg-encore-surface border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                    />

                  </div>

                  <div>

                    <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                      Offer Expiration
                    </label>

                    <input
                      type="date"
                      name="offerExpiresAt"
                      value={formData.offerExpiresAt}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-encore-surface border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                    />

                  </div>

                </div>

              )}

              {/* Service Reminder */}
              {formData.type === "SERVICE_REMINDER" && (

                <div className="space-y-5 p-5 rounded-xl bg-encore-background border border-encore-border">

                  <div>

                    <h4 className="font-semibold text-encore-text">
                      Service Reminder Details
                    </h4>

                    <p className="mt-1 text-sm text-encore-text-muted">
                      Tell Encore which service this reminder is for.
                    </p>

                  </div>

                  <div>

                    <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                      Service Name
                    </label>

                    <input
                      type="text"
                      name="serviceName"
                      value={formData.serviceName}
                      onChange={handleChange}
                      placeholder="Dental Cleaning"
                      className="w-full px-4 py-3 rounded-lg bg-encore-surface border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                    />

                  </div>

                  <div>

                    <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                      Remind Before Due Date
                    </label>

                    <div className="flex gap-3 items-center">

                      <input
                        type="number"
                        name="reminderDaysBefore"
                        value={formData.reminderDaysBefore}
                        onChange={handleChange}
                        min="0"
                        className="w-32 px-4 py-3 rounded-lg bg-encore-surface border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                      />

                      <span className="text-encore-text-secondary">
                        days before
                      </span>

                    </div>

                  </div>

                </div>

              )}

              {/* Recipients */}
<div className="space-y-5 p-5 rounded-xl bg-encore-background border border-encore-border">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h4 className="font-semibold text-encore-text">
        Recipients
      </h4>

      <p className="mt-1 text-sm text-encore-text-muted">
        Select the customers who should receive this campaign.
      </p>
    </div>

    <div className="text-sm text-encore-text-secondary">
      {selectedCustomerIds.length} selected
    </div>
  </div>

  {customers.length === 0 ? (
    <div className="rounded-lg border border-encore-border bg-encore-surface p-4">
      <p className="text-sm text-encore-text-secondary">
        No customers found. Add customers first from the Customers page.
      </p>
    </div>
  ) : (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            setSelectedCustomerIds(customers.map((customer) => customer.id))
          }
          className="px-4 py-2 rounded-lg border border-encore-border text-sm text-encore-text-secondary hover:bg-encore-surface hover:text-encore-text transition"
        >
          Select All
        </button>

        <button
          type="button"
          onClick={() => setSelectedCustomerIds([])}
          className="px-4 py-2 rounded-lg border border-encore-border text-sm text-encore-text-secondary hover:bg-encore-surface hover:text-encore-text transition"
        >
          Clear All
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {customers.map((customer) => {
          const isSelected = selectedCustomerIds.includes(customer.id);

          return (
            <label
              key={customer.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                isSelected
                  ? "border-encore-primary bg-encore-primary/10"
                  : "border-encore-border bg-encore-surface hover:bg-encore-background"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {
                  setSelectedCustomerIds((previous) =>
                    isSelected
                      ? previous.filter((id) => id !== customer.id)
                      : [...previous, customer.id]
                  );
                }}
                className="h-4 w-4 accent-blue-600"
              />

              <div className="min-w-0">
                <p className="font-medium text-encore-text">
                  {customer.name}
                </p>

                <p className="text-sm text-encore-text-muted truncate">
                  {customer.email || customer.phone || "No contact information"}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </>
  )}
</div>

              {/* Email Subject */}
              {(formData.channel === "EMAIL" ||
                formData.channel === "BOTH") && (
                <div>
                  <label
                    htmlFor="emailSubject"
                    className="block mb-2 text-sm font-medium text-encore-text-secondary"
                  >
                    Email Subject
                  </label>

                  <input
                    type="text"
                    id="emailSubject"
                    name="emailSubject"
                    value={formData.emailSubject}
                    onChange={handleChange}
                    placeholder="A quick follow-up from ABC Dental"
                    maxLength={200}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  />
                </div>
              )}

              {/* Email Body */}
              {(formData.channel === "EMAIL" ||
                formData.channel === "BOTH") && (
                <div>
                  <label
                    htmlFor="emailBody"
                    className="block mb-2 text-sm font-medium text-encore-text-secondary"
                  >
                    Email Body
                  </label>

                  <textarea
                    id="emailBody"
                    name="emailBody"
                    value={formData.emailBody}
                    onChange={handleChange}
                    placeholder="Hi {{customer.name}}, thank you for visiting us..."
                    rows={6}
                    maxLength={10000}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted resize-y focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  />

                  <p className="mt-2 text-xs text-encore-text-muted">
                    Write the email message your customers will receive.
                  </p>
                </div>
              )}

              {/* Message */}
              <div>

                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Message Template
                </label>

                <textarea
                  name="messageTemplate"
                  value={formData.messageTemplate}
                  onChange={handleChange}
                  placeholder="Hi {{customer.name}}, we wanted to let you know..."
                  rows="5"
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />

                <p className="mt-2 text-xs text-encore-text-muted">
                  We'll add AI-generated messaging here later.
                </p>

              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isSaving}
                  className="px-5 py-3 rounded-lg border border-encore-border text-encore-text-secondary hover:bg-encore-background transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-3 rounded-lg bg-encore-primary text-white font-semibold hover:bg-encore-primary-hover transition disabled:opacity-50"
                >
                  {isSaving
                    ? editingCampaign
                      ? "Updating..."
                      : "Creating..."
                    : editingCampaign
                      ? "Update Campaign"
                      : "Create Campaign"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">

          <div className="w-full max-w-md bg-encore-surface border border-encore-border rounded-2xl p-8">

            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl">
              !
            </div>

            <h3 className="mt-6 text-2xl font-bold text-encore-text">
              Delete campaign?
            </h3>

            <p className="mt-3 text-encore-text-secondary leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-encore-text font-semibold">
                {campaignToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-8 flex justify-end gap-3">

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-5 py-3 rounded-lg border border-encore-border text-encore-text-secondary hover:bg-encore-background transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting
                  ? "Deleting..."
                  : "Delete Campaign"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}