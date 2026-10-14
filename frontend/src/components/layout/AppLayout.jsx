import { NavLink, Outlet } from "react-router-dom";
import { UserButton, OrganizationSwitcher } from "@clerk/react";

export default function AppLayout() {
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Customers", path: "/customers" },
    { name: "Campaigns", path: "/campaigns" },
    { name: "Analytics", path: "/analytics" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-encore-background text-encore-text flex">

      <aside className="w-64 min-h-screen border-r border-encore-border bg-encore-surface p-6">

        <div className="mb-10">
          <h1 className="text-xl font-bold">
            Project Encore 🚀
          </h1>

          <p className="mt-1 text-sm text-encore-text-muted">
            Business workspace
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-encore-primary text-white"
                    : "text-encore-text-secondary hover:bg-encore-background hover:text-encore-text"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

      </aside>

      <div className="flex-1">

        <header className="h-20 border-b border-encore-border flex items-center justify-between px-8">

          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
          />

          <UserButton />

        </header>

        <main>
          <Outlet />
        </main>

      </div>

    </div>
  );
}