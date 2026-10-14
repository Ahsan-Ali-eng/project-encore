export default function Testimonials() {
  return (
    <section className="px-8 py-24 bg-encore-background">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-encore-text">
            Loved by businesses that want more repeat customers
          </h2>

          <p className="mt-4 text-encore-text-secondary max-w-2xl mx-auto">
            See how businesses are using Project Encore to stay connected
            with their customers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border">
            <p className="text-encore-text-secondary leading-relaxed">
              “Project Encore makes customer follow-ups incredibly simple.
              We no longer have to remember to reach out manually.”
            </p>

            <div className="mt-6">
              <h3 className="font-semibold text-encore-text">
                Sarah Mitchell
              </h3>

              <p className="text-sm text-encore-text-muted">
                Owner, Local Service Business
              </p>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border">
            <p className="text-encore-text-secondary leading-relaxed">
              “The combination of AI, SMS, and email saves our team a huge
              amount of time while keeping customers engaged.”
            </p>

            <div className="mt-6">
              <h3 className="font-semibold text-encore-text">
                Michael Carter
              </h3>

              <p className="text-sm text-encore-text-muted">
                Manager, Growing Business
              </p>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-encore-surface border border-encore-border">
            <p className="text-encore-text-secondary leading-relaxed">
              “Instead of losing customers after the first visit, we now
              have a simple system for staying in touch.”
            </p>

            <div className="mt-6">
              <h3 className="font-semibold text-encore-text">
                James Anderson
              </h3>

              <p className="text-sm text-encore-text-muted">
                Business Owner
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}