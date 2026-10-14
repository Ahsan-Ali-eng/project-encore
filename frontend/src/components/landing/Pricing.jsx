export default function Pricing() {
  return (
    <section className="px-8 py-24 bg-encore-background">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-encore-text">
            Simple plans that scale with your business
          </h2>

          <p className="mt-4 text-encore-text-secondary max-w-2xl mx-auto">
            Choose the plan that fits your business today and upgrade as
            your customer base grows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border">
            <h3 className="text-2xl font-semibold text-encore-text">
              Starter
            </h3>

            <p className="mt-3 text-encore-text-muted">
              For businesses getting started with automated follow-ups.
            </p>

            <div className="mt-8">
              <span className="text-3xl font-bold text-encore-text">
                Coming Soon
              </span>
            </div>

            <button className="mt-8 w-full py-3 rounded-lg border border-encore-border text-encore-text-secondary hover:bg-encore-background transition">
              Get Started
            </button>
          </div>

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-primary/50">
            <div className="inline-block px-3 py-1 rounded-full bg-encore-primary/10 text-blue-400 text-sm font-medium">
              Recommended
            </div>

            <h3 className="mt-4 text-2xl font-semibold text-encore-text">
              Growth
            </h3>

            <p className="mt-3 text-encore-text-muted">
              For growing businesses that want more automation and
              customer engagement.
            </p>

            <div className="mt-8">
              <span className="text-3xl font-bold text-encore-text">
                Coming Soon
              </span>
            </div>

            <button className="mt-8 w-full py-3 rounded-lg bg-encore-primary text-white hover:bg-encore-primary-hover transition">
              Get Started
            </button>
          </div>

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border">
            <h3 className="text-2xl font-semibold text-encore-text">
              Scale
            </h3>

            <p className="mt-3 text-encore-text-muted">
              For businesses ready to maximize retention and automate
              customer communication.
            </p>

            <div className="mt-8">
              <span className="text-3xl font-bold text-encore-text">
                Coming Soon
              </span>
            </div>

            <button className="mt-8 w-full py-3 rounded-lg border border-encore-border text-encore-text-secondary hover:bg-encore-background transition">
              Get Started
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}