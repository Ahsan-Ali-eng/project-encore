import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/react";

import StatCard from "../../components/common/StatCard";
import { apiRequest } from "../../services/api";

export default function Dashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function loadDashboardData() {
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
        console.error("Failed to load dashboard data:", error);
        setError(error.message);
      }
    }

    loadDashboardData();
  }, [isLoaded, isSignedIn, getToken]);

  const activeCustomers = customers.filter(
    (customer) => customer.status === "active"
  );

  const recentCustomers = customers.slice(0, 5);

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <h2 className="text-3xl font-bold text-encore-text">
            Dashboard
          </h2>

          <p className="mt-2 text-encore-text-secondary">
            Here's an overview of your Project Encore workspace.
          </p>
        </div>

        <Link
          to="/customers"
          className="w-full md:w-auto text-center bg-encore-primary px-5 py-3 rounded-lg text-white font-semibold hover:bg-encore-primary-hover transition"
        >
          + Add Customer
        </Link>

      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard
          title="Total Customers"
          value={customers.length}
          description="Customers in your workspace"
        />

        <StatCard
          title="Active Customers"
          value={activeCustomers.length}
          description="Currently active customers"
        />

        <StatCard
          title="Active Campaigns"
          value="0"
          description="Campaigns will appear here"
        />

        <StatCard
          title="Messages Sent"
          value="0"
          description="Messages will appear here"
        />

      </div>

      {/* Main content */}
      <div className="grid xl:grid-cols-3 gap-6 mt-8">

        {/* Recent customers */}
        <div className="xl:col-span-2 bg-encore-surface border border-encore-border rounded-2xl overflow-hidden">

          <div className="flex items-center justify-between px-6 py-5 border-b border-encore-border">

            <div>
              <h3 className="text-xl font-semibold text-encore-text">
                Recent Customers
              </h3>

              <p className="mt-1 text-sm text-encore-text-muted">
                Your latest customer records.
              </p>
            </div>

            <Link
              to="/customers"
              className="text-sm text-blue-400 hover:text-blue-300 transition"
            >
              View all
            </Link>

          </div>

          {recentCustomers.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <h4 className="text-lg font-semibold text-encore-text">
                No customers yet
              </h4>

              <p className="mt-2 text-encore-text-secondary">
                Add your first customer to start building your workspace.
              </p>

              <Link
                to="/customers"
                className="inline-block mt-6 bg-encore-primary px-5 py-3 rounded-lg text-white font-semibold hover:bg-encore-primary-hover transition"
              >
                Add Customer
              </Link>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-encore-border text-left">

                    <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                      Name
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                      Email
                    </th>

                    <th className="px-6 py-4 text-sm font-medium text-encore-text-muted">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {recentCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-encore-border last:border-b-0 hover:bg-encore-background/40 transition"
                    >

                      <td className="px-6 py-4 text-encore-text font-medium">
                        {customer.name}
                      </td>

                      <td className="px-6 py-4 text-encore-text-secondary">
                        {customer.email || "—"}
                      </td>

                      <td className="px-6 py-4">

                        <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          {customer.status}
                        </span>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* Quick actions */}
        <div className="bg-encore-surface border border-encore-border rounded-2xl p-6">

          <h3 className="text-xl font-semibold text-encore-text">
            Quick Actions
          </h3>

          <p className="mt-1 text-sm text-encore-text-muted">
            Common actions for your business.
          </p>

          <div className="mt-6 space-y-3">

            <Link
              to="/customers"
              className="block p-4 rounded-xl border border-encore-border hover:bg-encore-background transition"
            >
              <p className="font-medium text-encore-text">
                Add Customer
              </p>

              <p className="mt-1 text-sm text-encore-text-muted">
                Add a new customer to your workspace.
              </p>
            </Link>

            <Link
              to="/campaigns"
              className="block p-4 rounded-xl border border-encore-border hover:bg-encore-background transition"
            >
              <p className="font-medium text-encore-text">
                Create Campaign
              </p>

              <p className="mt-1 text-sm text-encore-text-muted">
                Set up an automated follow-up campaign.
              </p>
            </Link>

            <Link
              to="/analytics"
              className="block p-4 rounded-xl border border-encore-border hover:bg-encore-background transition"
            >
              <p className="font-medium text-encore-text">
                View Analytics
              </p>

              <p className="mt-1 text-sm text-encore-text-muted">
                Track customer engagement and results.
              </p>
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}