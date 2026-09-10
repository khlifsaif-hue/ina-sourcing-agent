const pipeline = [
  ["Suppliers found", "0"], ["Qualified", "0"], ["RFQs sent", "0"], ["Offers received", "0"],
  ["Compliant", "0"], ["Samples", "0"], ["Negotiating", "0"], ["Recommended", "0"],
];

const stages = ["Requirement", "Discovery", "Qualification", "RFQ", "Quotation", "Compliance", "Negotiation", "Sample", "Landed Cost", "Decision"];

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">INA SMART · PROCUREMENT INTELLIGENCE</p>
          <h1>Sourcing Command Center</h1>
          <p className="muted">One workflow for equipment, materials, electronics, machinery, consumables and custom manufacturing.</p>
        </div>
        <button className="primary" disabled>+ New sourcing request</button>
      </header>

      <section className="request card">
        <div className="requestHead">
          <div><span className="status">SETUP IN PROGRESS</span><h2>Sourcing request</h2></div>
          <div className="actions"><button disabled>Pause</button><button disabled>Export</button><button className="primary" disabled>Run sourcing</button></div>
        </div>
        <p className="muted">Supplier search, email and sign-in are being connected. Sourcing and supplier contact are not active yet.</p>
        <div className="requestGrid">
          <label>Product<input placeholder="e.g. CAT6 cable, CNC machine, robotics kit" /></label>
          <label>Quantity<input placeholder="500" /></label>
          <label>Destination<input defaultValue="Doha, Qatar" /></label>
          <label>Target Incoterm<select defaultValue="FOB"><option>EXW</option><option>FOB</option><option>CIF</option><option>DDP</option></select></label>
        </div>
      </section>

      <section className="metrics">
        {pipeline.map(([label,value]) => <div className="metric card" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </section>

      <section className="card">
        <div className="sectionHead"><div><h2>Procurement pipeline</h2><p className="muted">Planned workflow from technical requirement to approved supplier.</p></div><span className="pill">Commercial approval required</span></div>
        <div className="stages">{stages.map((stage,i)=><div className="stage" key={stage}><b>{i+1}</b><span>{stage}</span></div>)}</div>
      </section>

      <div className="twoCol">
        <section className="card">
          <div className="sectionHead"><h2>Supplier comparison</h2><button disabled>View all</button></div>
          <div className="tableWrap"><table><thead><tr><th>Supplier</th><th>Type</th><th>Compliance</th><th>Unit</th><th>Landed</th><th>Lead</th><th>Score</th></tr></thead><tbody><tr><td colSpan={7} className="empty">No supplier offers yet. Search and quote intake need to be connected.</td></tr></tbody></table></div>
        </section>
        <section className="card">
          <h2>Agent control</h2>
          <div className="control"><span>Supplier search</span><b>Not connected</b></div>
          <div className="control"><span>RFQ & clarification</span><b>Not connected</b></div>
          <div className="control"><span>Price / MOQ negotiation</span><b>Not connected</b></div>
          <div className="control warning"><span>Specification deviation</span><b>Approval</b></div>
          <div className="control warning"><span>Sample payment</span><b>Approval</b></div>
          <div className="control danger"><span>PO / payment</span><b>Locked</b></div>
        </section>
      </div>

      <div className="twoCol">
        <section className="card"><h2>Technical compliance</h2><p className="muted">Mandatory requirements are hard gates. A cheaper non-compliant substitute cannot win the recommendation.</p><div className="emptyBox">Select a quotation to see line-by-line requested vs offered specifications.</div></section>
        <section className="card"><h2>Activity & negotiation</h2><p className="muted">Every supplier message, quotation revision, price movement and agent action is auditable.</p><div className="emptyBox">No activity recorded for this request.</div></section>
      </div>
    </main>
  );
}
