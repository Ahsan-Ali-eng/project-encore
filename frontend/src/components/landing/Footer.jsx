export default function Footer() {
  return (
    <footer className="bg-encore-background border-t border-encore-border">
      <div className="max-w-7xl mx-auto px-8 py-12">

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          <div>
            <h2 className="text-xl font-bold text-encore-text">
              Project Encore 🚀
            </h2>

            <p className="mt-2 text-sm text-encore-text-muted">
              Smarter follow-ups. More repeat customers.
            </p>
          </div>

          <div className="flex items-center gap-6">

            <a
              href="/"
              className="text-encore-text-secondary hover:text-encore-text transition"
            >
              Home
            </a>

            <a
              href="/login"
              className="text-encore-text-secondary hover:text-encore-text transition"
            >
              Login
            </a>

            <a
              href="/register"
              className="text-encore-text-secondary hover:text-encore-text transition"
            >
              Get Started
            </a>

          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-encore-border flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-encore-text-muted">
            © 2026 Sense Spark Hub. All rights reserved.
          </p>

          <a
            href="mailto:support@sensesparkhub.com"
            className="text-sm text-encore-text-secondary hover:text-encore-text transition"
          >
            support@sensesparkhub.com
          </a>

        </div>

      </div>
    </footer>
  );
}