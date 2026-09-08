export default function HomePage() {
  return (
    <main>
      <h1>INA Sourcing Agent</h1>
      <p>Standalone procurement intelligence platform for supplier discovery, RFQs, technical compliance, negotiation, samples, and landed-cost comparison.</p>

      <section className="card">
        <h2>Phase 1 foundation</h2>
        <div className="grid">
          {[
            ["Requirements", "RFQ-ready technical specifications"],
            ["Suppliers", "Factory and contact intelligence"],
            ["Quotations", "Commercial offer normalization"],
            ["Compliance", "Line-by-line technical evaluation"],
            ["Negotiation", "Price/MOQ/lead-time history"],
            ["Landed cost", "Qatar final-cost comparison"],
          ].map(([title, text]) => (
            <div className="metric" key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Safety rule</h2>
        <p>A cheaper offer that changes a required specification is recorded as a deviation, never silently accepted as equivalent.</p>
      </section>
    </main>
  );
}
