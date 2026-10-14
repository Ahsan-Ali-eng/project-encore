import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="min-h-screen bg-encore-background text-encore-text flex flex-col items-center justify-center px-8">

      <h1 className="text-6xl font-bold text-center">
        Project Encore 🚀
      </h1>

      <p className="mt-6 text-xl text-encore-text-secondary max-w-2xl text-center">
        Build, manage and grow your business from one powerful workspace.
      </p>

      <div className="mt-8 flex gap-4">

        <Link
          to="/register"
          className="bg-encore-primary px-6 py-3 rounded-lg text-white hover:bg-encore-primary-hover transition"
        >
          Get Started
        </Link>

        <Link
          to="/login"
          className="border border-encore-border px-6 py-3 rounded-lg text-encore-text-secondary hover:bg-encore-surface transition"
        >
          Book Demo
        </Link>

      </div>

    </section>
  );
}