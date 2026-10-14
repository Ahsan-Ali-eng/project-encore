import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="w-full px-8 py-5 bg-encore-background border-b border-encore-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        <Link
          to="/"
          className="text-xl font-bold text-encore-text"
        >
          Project Encore 🚀
        </Link>

        <div className="flex items-center gap-8">

          <Link
            to="/"
            className="text-encore-text-secondary hover:text-encore-text transition"
          >
            Home
          </Link>

          <Link
            to="/login"
            className="text-encore-text-secondary hover:text-encore-text transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="bg-encore-primary px-5 py-2.5 rounded-lg text-white hover:bg-encore-primary-hover transition"
          >
            Get Started
          </Link>

        </div>

      </div>
    </nav>
  );
}