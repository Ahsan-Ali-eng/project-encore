import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

import { apiRequest } from "../../services/api";

export default function Customers() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerServices, setCustomerServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [customerActivities, setCustomerActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [editingActivity, setEditingActivity] = useState(null);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [activityFormData, setActivityFormData] = useState({
  type: "NOTE",
  title: "",
  description: "",
  occurredAt: "",
  });
  const [editingService, setEditingService] = useState(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [serviceFormData, setServiceFormData] = useState({
  serviceName: "",
  lastServiceAt: "",
  nextServiceAt: "",
  notes: "",
});

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function loadCustomers() {
      try {
        setError("");

        const token = await getToken();

        const data = await apiRequest(
          "/customers",
          {},
          token
        );

        setCustomers(data);
      } catch (error) {
        console.error("Failed to load customers:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomers();
  }, [isLoaded, isSignedIn, getToken]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openAddModal() {
    setEditingCustomer(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
    });

    setError("");
    setIsModalOpen(true);
  }

  async function openServicesModal(customer) {
  setSelectedCustomer(customer);
  setCustomerServices([]);
  setServiceError("");
  setEditingService(null);

  setServiceFormData({
    serviceName: "",
    lastServiceAt: "",
    nextServiceAt: "",
    notes: "",
  });

  setServiceModalOpen(true);
  setIsLoadingServices(true);

  try {
    const token = await getToken();

    const data = await apiRequest(
      `/services/customer/${customer.id}`,
      {},
      token
    );

    setCustomerServices(data);
  } catch (error) {
    console.error("Failed to load customer services:", error);
    setServiceError(error.message);
  } finally {
    setIsLoadingServices(false);
  }
}

async function handleServiceSubmit(event) {
  event.preventDefault();

  if (!selectedCustomer) {
    return;
  }

  try {
    setServiceError("");
    setIsSavingService(true);

    const token = await getToken();

    const serviceData = {
      serviceName: serviceFormData.serviceName,
      lastServiceAt: serviceFormData.lastServiceAt || null,
      nextServiceAt: serviceFormData.nextServiceAt || null,
      notes: serviceFormData.notes,
    };

    if (editingService) {
      const updatedService = await apiRequest(
        `/services/${editingService.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(serviceData),
        },
        token
      );

      setCustomerServices((previous) =>
        previous.map((service) =>
          service.id === updatedService.id
            ? updatedService
            : service
        )
      );
    } else {
      const newService = await apiRequest(
        "/services",
        {
          method: "POST",
          body: JSON.stringify({
            customerId: selectedCustomer.id,
            ...serviceData,
          }),
        },
        token
      );

      setCustomerServices((previous) => [
        ...previous,
        newService,
      ]);
    }

    setEditingService(null);

    setServiceFormData({
      serviceName: "",
      lastServiceAt: "",
      nextServiceAt: "",
      notes: "",
    });
  } catch (error) {
    console.error("Failed to save customer service:", error);
    setServiceError(error.message);
  } finally {
    setIsSavingService(false);
  }
}

function openEditService(service) {
  setEditingService(service);

  setServiceFormData({
    serviceName: service.serviceName || "",
    lastServiceAt: service.lastServiceAt
      ? new Date(service.lastServiceAt).toISOString().split("T")[0]
      : "",
    nextServiceAt: service.nextServiceAt
      ? new Date(service.nextServiceAt).toISOString().split("T")[0]
      : "",
    notes: service.notes || "",
  });

  setServiceError("");
}

async function handleDeleteService(service) {
  if (!service) {
    return;
  }

  try {
    setServiceError("");
    setIsDeletingService(true);

    const token = await getToken();

    await apiRequest(
      `/services/${service.id}`,
      {
        method: "DELETE",
      },
      token
    );

    setCustomerServices((previous) =>
      previous.filter((item) => item.id !== service.id)
    );

    setServiceToDelete(null);
  } catch (error) {
    console.error("Failed to delete customer service:", error);
    setServiceError(error.message);
  } finally {
    setIsDeletingService(false);
  }
}

async function handleDeleteActivity() {
  if (!activityToDelete) return;

  try {
    setIsDeletingActivity(true);

    const token = await getToken();

    await apiRequest(
      `/activities/${activityToDelete.id}`,
      {
        method: "DELETE",
      },
      token
    );

    setCustomerActivities((currentActivities) =>
      currentActivities.filter(
        (activity) => activity.id !== activityToDelete.id
      )
    );

    setActivityToDelete(null);
  } catch (error) {
    console.error("Activity delete failed:", error);
    setActivityError(error.message || "Failed to delete activity.");
  } finally {
    setIsDeletingActivity(false);
  }
}

async function openActivityModal(customer) {
  setSelectedCustomer(customer);
  setCustomerActivities([]);
  setActivityError("");

  setActivityModalOpen(true);
  setIsLoadingActivities(true);

  try {
    const token = await getToken();

    const data = await apiRequest(
      `/activities/customer/${customer.id}`,
      {},
      token
    );

    setCustomerActivities(data);
  } catch (error) {
    console.error("Failed to load customer activities:", error);
    setActivityError(error.message);
  } finally {
    setIsLoadingActivities(false);
  }
}

function openEditActivity(activity) {
  setEditingActivity(activity);

  setActivityFormData({
    type: activity.type || "NOTE",
    title: activity.title || "",
    description: activity.description || "",
    occurredAt: activity.occurredAt
      ? new Date(activity.occurredAt).toISOString().split("T")[0]
      : "",
  });

  setActivityError("");
}

async function handleActivitySubmit(event) {
  event.preventDefault();

  if (!selectedCustomer) return;

  try {
    setIsSavingActivity(true);
    setActivityError("");

    const token = await getToken();

    const payload = {
      customerId: selectedCustomer.id,
      type: activityFormData.type,
      title: activityFormData.title,
      description: activityFormData.description || null,
      occurredAt: activityFormData.occurredAt
        ? new Date(activityFormData.occurredAt).toISOString()
        : new Date().toISOString(),
    };

    if (editingActivity) {
      const updatedActivity = await apiRequest(
        `/activities/${editingActivity.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        token
      );

      setCustomerActivities((currentActivities) =>
        currentActivities.map((activity) =>
          activity.id === updatedActivity.id
            ? updatedActivity
            : activity
        )
      );
    } else {
      const newActivity = await apiRequest(
        "/activities",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token
      );

      setCustomerActivities((currentActivities) => [
        newActivity,
        ...currentActivities,
      ]);
    }

    setActivityFormData({
      type: "NOTE",
      title: "",
      description: "",
      occurredAt: "",
    });

    setEditingActivity(null);
  } catch (error) {
    console.error("Activity save failed:", error);
    setActivityError(error.message || "Failed to save activity.");
  } finally {
    setIsSavingActivity(false);
  }
}

  function openEditModal(customer) {
    setEditingCustomer(customer);

    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
    });

    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCustomer(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setIsSaving(true);

      const token = await getToken();

      if (editingCustomer) {
        const updatedCustomer = await apiRequest(
          `/customers/${editingCustomer.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(formData),
          },
          token
        );

        setCustomers((previous) =>
          previous.map((customer) =>
            customer.id === updatedCustomer.id
              ? updatedCustomer
              : customer
          )
        );
      } else {
        const newCustomer = await apiRequest(
          "/customers",
          {
            method: "POST",
            body: JSON.stringify(formData),
          },
          token
        );

        setCustomers((previous) => [
          newCustomer,
          ...previous,
        ]);
      }

      closeModal();
    } catch (error) {
      console.error("Failed to save customer:", error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteModal(customer) {
    setCustomerToDelete(customer);
    setError("");
  }

  function closeDeleteModal() {
    if (!isDeleting) {
      setCustomerToDelete(null);
    }
  }

  async function handleDelete() {
    if (!customerToDelete) {
      return;
    }

    try {
      setError("");
      setIsDeleting(true);

      const token = await getToken();

      await apiRequest(
        `/customers/${customerToDelete.id}`,
        {
          method: "DELETE",
        },
        token
      );

      setCustomers((previous) =>
        previous.filter(
          (customer) => customer.id !== customerToDelete.id
        )
      );

      setCustomerToDelete(null);
    } catch (error) {
      console.error("Failed to delete customer:", error);
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();

    return (
      customer.name.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

        <div>
          <h2 className="text-3xl font-bold text-encore-text">
            Customers
          </h2>

          <p className="mt-2 text-encore-text-secondary">
            Manage your customer relationships in one place.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full lg:w-auto bg-encore-primary px-5 py-3 rounded-lg text-white font-semibold hover:bg-encore-primary-hover transition"
        >
          + Add Customer
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search customers..."
          className="w-full max-w-md px-4 py-3 rounded-lg bg-encore-surface border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
        />
      </div>

      {/* Customer table */}
      <div className="bg-encore-surface border border-encore-border rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-225">

            <thead>
              <tr className="border-b border-encore-border text-left">

                <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                  Name
                </th>

                <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                  Email
                </th>

                <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                  Phone
                </th>

                <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                  Status
                </th>

                <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <p className="text-encore-text-secondary">
                      Loading customers...
                    </p>
                  </td>
                </tr>

              ) : filteredCustomers.length === 0 ? (

                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">

                    <h3 className="text-xl font-semibold text-encore-text">
                      {searchTerm
                        ? "No customers found"
                        : "No customers yet"}
                    </h3>

                    <p className="mt-2 text-encore-text-secondary">
                      {searchTerm
                        ? "Try a different search."
                        : "Add your first customer to get started with Project Encore."
                      }
                    </p>

                    {!searchTerm && (
                      <button
                        onClick={openAddModal}
                        className="mt-6 bg-encore-primary px-5 py-3 rounded-lg text-white font-semibold hover:bg-encore-primary-hover transition"
                      >
                        + Add Customer
                      </button>
                    )}

                  </td>
                </tr>

              ) : (

                filteredCustomers.map((customer) => (

                  <tr
                    key={customer.id}
                    className="border-b border-encore-border last:border-b-0 hover:bg-encore-background/40 transition"
                  >

                    <td className="px-6 py-5 text-encore-text font-medium">
                      {customer.name}
                    </td>

                    <td className="px-6 py-5 text-encore-text-secondary">
                      {customer.email || "—"}
                    </td>

                    <td className="px-6 py-5 text-encore-text-secondary">
                      {customer.phone || "—"}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        {customer.status}
                      </span>
                    </td>

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-4">

                        <button
                          type="button"
                          onClick={() => openActivityModal(customer)}
                          className="text-purple-400 hover:text-purple-300 transition font-medium"
                        >
                        Activity
                        </button>

                        <button
                          onClick={() => openServicesModal(customer)}
                          className="text-emerald-400 hover:text-emerald-300 transition font-medium"
                        >
                         Services
                        </button>

                        <button
                          onClick={() => openEditModal(customer)}
                          className="text-blue-400 hover:text-blue-300 transition font-medium"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => openDeleteModal(customer)}
                          className="text-red-400 hover:text-red-300 transition font-medium"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">

          <div className="w-full max-w-lg bg-encore-surface border border-encore-border rounded-2xl p-8">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h3 className="text-2xl font-bold text-encore-text">
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
                </h3>

                <p className="mt-1 text-sm text-encore-text-muted">
                  {editingCustomer
                    ? "Update this customer's information."
                    : "Add a customer to your Encore workspace."
                  }
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-encore-text-muted hover:text-encore-text text-2xl"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Smith"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={(event) => {
                    const inputValue = event.target.value;

                    const cleanedValue = inputValue.startsWith("+")
                      ? `+${inputValue.slice(1).replace(/\D/g, "")}`
                      : inputValue.replace(/\D/g, "");

                    setFormData((current) => ({
                      ...current,
                      phone: cleanedValue,
                    }));
                  }}
                  placeholder="+14165550123"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={16}
                  pattern="^\+[1-9]\d{7,14}$"
                  title="Use international format: + followed by country code and digits only, without spaces or dashes."
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />
                <p className="mt-1 text-xs text-encore-text-muted">
                  Include your country code. Start with + and use digits only,
                  without spaces or dashes. Example: +14165550123.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 rounded-lg border border-encore-border text-encore-text-secondary hover:bg-encore-background transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-3 rounded-lg bg-encore-primary text-white font-semibold hover:bg-encore-primary-hover transition disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving..."
                    : editingCustomer
                      ? "Update Customer"
                      : "Save Customer"
                  }
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
      {/* Services Modal */}
      {serviceModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 py-8 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl bg-encore-surface border border-encore-border rounded-2xl p-8 my-auto">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-encore-text">
                  Services
                </h3>

                <p className="mt-1 text-sm text-encore-text-muted">
                  {selectedCustomer?.name || "Customer"} services
                </p>
              </div>

              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="text-encore-text-muted hover:text-encore-text text-2xl"
              >
                ×
              </button>
            </div>

            {serviceError && (
              <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {serviceError}
              </div>
            )}

            {isLoadingServices ? (
              <div className="rounded-xl border border-encore-border bg-encore-background p-8 text-center">
                <p className="text-encore-text-secondary">
                  Loading services...
                </p>
              </div>
            ) : customerServices.length === 0 ? (
              <div className="rounded-xl border border-encore-border bg-encore-background p-8 text-center">
                <h4 className="text-lg font-semibold text-encore-text">
                  No services yet
                </h4>

                <p className="mt-2 text-sm text-encore-text-secondary">
                  Add this customer's first service below.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-xl border border-encore-border bg-encore-background p-4"
                  >
                    <p className="font-semibold text-encore-text">
                      {service.serviceName}
                    </p>

                    <div className="mt-2 grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-encore-text-muted">
                          Last Service
                        </p>

                        <p className="mt-1 text-encore-text-secondary">
                          {service.lastServiceAt
                            ? new Date(service.lastServiceAt).toLocaleDateString()
                            : "Not recorded"}
                        </p>
                      </div>

                      <div>
                        <p className="text-encore-text-muted">
                          Next Service
                        </p>

                        <p className="mt-1 text-encore-text-secondary">
                          {service.nextServiceAt
                            ? new Date(service.nextServiceAt).toLocaleDateString()
                            : "Not scheduled"}
                        </p>
                      </div>
                    </div>

                    {service.notes && (
                      <p className="mt-3 text-sm text-encore-text-secondary">
                        {service.notes}
                      </p>
                    )}
                    <div className="mt-4 flex justify-end gap-4">
                     <button
                      type="button"
                      onClick={() => openEditService(service)}
                      className="text-blue-400 hover:text-blue-300 transition font-medium"
                      >
                    Edit
                     </button>

                     <button
                      type="button"
                      onClick={() => setServiceToDelete(service)}
                      className="text-red-400 hover:text-red-300 transition font-medium"
                    >
                      Delete
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-encore-border pt-6">
              <h4 className="text-lg font-semibold text-encore-text">
                Add Service
              </h4>

              <p className="mt-1 text-sm text-encore-text-muted">
                Add a service and its next due date.
              </p>

              <form
                onSubmit={handleServiceSubmit}
                className="mt-5 space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                    Service Name
                  </label>

                  <input
                    type="text"
                    value={serviceFormData.serviceName}
                    onChange={(event) =>
                      setServiceFormData((previous) => ({
                        ...previous,
                        serviceName: event.target.value,
                      }))
                    }
                    placeholder="Dental Cleaning"
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                      Last Service
                    </label>

                    <input
                      type="date"
                      value={serviceFormData.lastServiceAt}
                      onChange={(event) =>
                        setServiceFormData((previous) => ({
                          ...previous,
                          lastServiceAt: event.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                      Next Service
                    </label>

                    <input
                      type="date"
                      value={serviceFormData.nextServiceAt}
                      onChange={(event) =>
                        setServiceFormData((previous) => ({
                          ...previous,
                          nextServiceAt: event.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                    Notes
                  </label>

                  <textarea
                    value={serviceFormData.notes}
                    onChange={(event) =>
                      setServiceFormData((previous) => ({
                        ...previous,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Regular 6-month cleaning"
                    rows="3"
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  />

                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingService}
                    className="px-5 py-3 rounded-lg bg-encore-primary text-white font-semibold hover:bg-encore-primary-hover transition disabled:opacity-50"
                  >
                    {isSavingService
                      ? "Saving..."
                      : editingService
                        ? "Save Changes"
                        : "Add Service"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Activity Modal */}
      {activityModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 py-8 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl bg-encore-surface border border-encore-border rounded-2xl p-8 my-auto">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-encore-text">
                  Customer Activity
                </h3>

                <p className="mt-1 text-sm text-encore-text-muted">
                  {selectedCustomer?.name || "Customer"} activity history
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivityModalOpen(false)}
                className="text-encore-text-muted hover:text-encore-text text-2xl"
              >
                ×
              </button>
            </div>

            {activityError && (
              <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                {activityError}
              </div>
            )}

            {isLoadingActivities ? (
              <div className="rounded-xl border border-encore-border bg-encore-background p-8 text-center">
                <p className="text-encore-text-secondary">
                  Loading activity...
                </p>
              </div>
            ) : customerActivities.length === 0 ? (
              <div className="rounded-xl border border-encore-border bg-encore-background p-8 text-center">
                <h4 className="text-lg font-semibold text-encore-text">
                  No activity yet
                </h4>

                <p className="mt-2 text-sm text-encore-text-secondary">
                  Customer activity will appear here as events are recorded.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-encore-border bg-encore-background p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-encore-text">
                          {activity.title}
                        </p>

                        <p className="mt-1 text-xs text-encore-text-muted">
                          {activity.type}
                        </p>
                      </div>

                      <p className="text-sm text-encore-text-muted">
                        {new Date(activity.occurredAt).toLocaleDateString()}
                      </p>
                    </div>

                    {activity.description && (
                      <p className="mt-3 text-sm text-encore-text-secondary">
                        {activity.description}
                      </p>
                    )}
                    <div className="mt-4 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => openEditActivity(activity)}
                        className="text-blue-400 hover:text-blue-300 transition font-medium"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivityToDelete(activity)}
                        className="text-red-400 hover:text-red-300 transition font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Activity Form */}
            <form
              onSubmit={handleActivitySubmit}
              className="mt-6 border-t border-encore-border pt-6"
            >
              <div>
                <h4 className="text-lg font-semibold text-encore-text">
                  Add Activity
                </h4>

                <p className="mt-1 text-sm text-encore-text-muted">
                  Record an important event in this customer's history.
                </p>
              </div>

              {activityError && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  {activityError}
                </div>
              )}

              <div className="mt-5 grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                    Activity Type
                  </label>

                  <select
                    value={activityFormData.type}
                    onChange={(event) =>
                      setActivityFormData((previous) => ({
                        ...previous,
                        type: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  >
                    <option value="NOTE">Note</option>
                    <option value="PURCHASE">Purchase</option>
                    <option value="SERVICE_COMPLETED">
                      Service Completed
                    </option>
                    <option value="REVIEW_RECEIVED">
                      Review Received
                    </option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                    Date
                  </label>

                  <input
                    type="date"
                    value={activityFormData.occurredAt}
                    onChange={(event) =>
                      setActivityFormData((previous) => ({
                        ...previous,
                        occurredAt: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text focus:outline-none focus:ring-2 focus:ring-encore-primary"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Title
                </label>

                <input
                  type="text"
                  value={activityFormData.title}
                  onChange={(event) =>
                    setActivityFormData((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Dental Cleaning Completed"
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />
              </div>

              <div className="mt-5">
                <label className="block mb-2 text-sm font-medium text-encore-text-secondary">
                  Description
                </label>

                <textarea
                  value={activityFormData.description}
                  onChange={(event) =>
                    setActivityFormData((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  rows="3"
                  placeholder="Customer completed their regular cleaning."
                  className="w-full px-4 py-3 rounded-lg bg-encore-background border border-encore-border text-encore-text placeholder:text-encore-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-encore-primary"
                />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-3 rounded-lg bg-encore-primary text-white font-semibold hover:bg-encore-primary-hover transition"
                >
                  {isSavingActivity
                    ? "Saving..."
                    : editingActivity
                    ? "Save Changes"
                    : "Add Activity"}
                </button>
              </div>
            </form>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActivityModalOpen(false)}
                className="px-5 py-3 rounded-lg border border-encore-border text-encore-text-secondary hover:bg-encore-background transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Activity Confirmation Modal */}
      {activityToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-encore-border bg-encore-surface p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-encore-text">
              Delete Activity
            </h3>

            <p className="mt-2 text-encore-text-secondary">
              Are you sure you want to delete this activity? This action cannot be
              undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActivityToDelete(null)}
                disabled={isDeletingActivity}
                className="rounded-lg border border-encore-border px-4 py-2 text-encore-text-secondary hover:bg-white/5 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteActivity}
                disabled={isDeletingActivity}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
              >
                {isDeletingActivity ? "Deleting..." : "Delete Activity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
        {serviceToDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-60">
            <div className="w-full max-w-md bg-encore-surface border border-encore-border rounded-2xl p-8">

              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl">
                !
              </div>

              <h3 className="mt-6 text-2xl font-bold text-encore-text">
                Delete service?
              </h3>

              <p className="mt-3 text-encore-text-secondary leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="text-encore-text font-semibold">
                  {serviceToDelete.serviceName}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setServiceToDelete(null)}
                  disabled={isDeletingService}
                  className="px-5 py-3 rounded-lg border border-encore-border text-encore-text-secondary hover:bg-encore-background transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteService(serviceToDelete)}
                  disabled={isDeletingService}
                  className="px-5 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeletingService ? "Deleting..." : "Delete Service"}
                </button>
              </div>

            </div>
          </div>
      )}


      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-50">

          <div className="w-full max-w-md bg-encore-surface border border-encore-border rounded-2xl p-8">

            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xl">
              !
            </div>

            <h3 className="mt-6 text-2xl font-bold text-encore-text">
              Delete customer?
            </h3>

            <p className="mt-3 text-encore-text-secondary leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-encore-text font-semibold">
                {customerToDelete.name}
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
                {isDeleting ? "Deleting..." : "Delete Customer"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}