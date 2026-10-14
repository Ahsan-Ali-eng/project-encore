export default function Features() {
  return (
    <section className="px-8 py-24 bg-encore-background">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-encore-text">
            Everything you need to grow your business
          </h2>

          <p className="mt-4 text-encore-text-secondary max-w-2xl mx-auto">
            Project Encore helps local businesses turn more customers
            into repeat customers through smarter follow-ups.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border hover:border-encore-primary/40 transition">
            <h3 className="text-xl font-semibold text-encore-text">
              AI-Powered Follow-ups
            </h3>

            <p className="mt-3 text-encore-text-muted">
              Create personalized customer messages using AI
              instead of writing every follow-up manually.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border hover:border-encore-primary/40 transition">
            <h3 className="text-xl font-semibold text-encore-text">
              SMS & Email
            </h3>

            <p className="mt-3 text-encore-text-muted">
              Reach customers through both SMS and email
              from one simple platform.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border hover:border-encore-primary/40 transition">
            <h3 className="text-xl font-semibold text-encore-text">
              Customer Segmentation
            </h3>

            <p className="mt-3 text-encore-text-muted">
              Organize customers into useful groups and send
              the right message at the right time.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}