export default function HowItWorks() {
  return (
    <section className="px-8 py-24 bg-encore-background">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-encore-text">
            How Project Encore works
          </h2>

          <p className="mt-4 text-encore-text-secondary max-w-2xl mx-auto">
            Turn one-time customers into repeat customers with a simple
            automated follow-up system.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="text-center p-8">
            <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-encore-primary text-white text-xl font-bold">
              1
            </div>

            <h3 className="mt-6 text-xl font-semibold text-encore-text">
              Add Your Customers
            </h3>

            <p className="mt-3 text-encore-text-muted">
              Add your customer information and keep everything organized
              in one simple workspace.
            </p>
          </div>

          <div className="text-center p-8">
            <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-encore-primary text-white text-xl font-bold">
              2
            </div>

            <h3 className="mt-6 text-xl font-semibold text-encore-text">
              Create a Follow-up
            </h3>

            <p className="mt-3 text-encore-text-muted">
              Use AI to create personalized SMS and email messages for
              your customers.
            </p>
          </div>

          <div className="text-center p-8">
            <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-encore-primary text-white text-xl font-bold">
              3
            </div>

            <h3 className="mt-6 text-xl font-semibold text-encore-text">
              Get Repeat Business
            </h3>

            <p className="mt-3 text-encore-text-muted">
              Stay connected with customers automatically and encourage
              them to come back.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}