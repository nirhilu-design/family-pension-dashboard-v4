// החלף את כל הקובץ

function ClientFamilyView({ clientModel }) {
  const summary = clientModel.summary || {};
  const exposures = clientModel.exposures || {};
  const members = clientModel.members || [];

  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  return (
    <div style={page}>
      <Header
        title="דוח משפחתי"
        subtitle="תמונה מאוחדת של כלל הנכסים והתחזיות"
      />

      <div style={grid4}>
        <KpiCard title="סך נכסים" value={formatCurrency(summary.totalAssets)} />
        <KpiCard title="הפקדה חודשית" value={formatCurrency(summary.monthlyDeposits)} />
        <KpiCard title="צבירה צפויה" value={formatCurrency(summary.projectedLumpSumWithDeposits)} />
        <KpiCard title="קצבה צפויה" value={formatCurrency(summary.monthlyPensionWithDeposits)} />
      </div>

      <Section title="חשיפות">
        <DataRow label="חשיפה למניות" value={formatPercent(exposures.equity)} />
        <Bar value={exposures.equity} />

        <DataRow label='חשיפה לחו"ל' value={formatPercent(exposures.foreign)} />
        <Bar value={exposures.foreign} />
      </Section>

      <Section title="בני משפחה">
        <div style={grid2}>
          {members.map((m) => (
            <div key={m.id} style={card}>
              <div style={title}>{m.name}</div>
              <DataRow label="נכסים" value={formatCurrency(m.summary.totalAssets)} />
              <DataRow label="קצבה" value={formatCurrency(m.summary.monthlyPensionWithDeposits)} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const page = {
  fontFamily: "Calibri",
  fontSize: 12,
  color: "#102A43",
};

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: 16,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: 16,
};

const card = {
  border: "1px solid #E2D1BF",
  borderRadius: 18,
  padding: 16,
  background: "#fff",
};

const title = {
  fontSize: 14,
  fontWeight: 700,
  color: "#00215D",
  marginBottom: 10,
};

function Header({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 14 }}>{title}</h1>
      <div style={{ fontSize: 12 }}>{subtitle}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 14 }}>{title}</h2>
      {children}
    </div>
  );
}

function KpiCard({ title, value }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#00215D" }}>{value}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Bar({ value }) {
  return (
    <div style={{ height: 10, background: "#EAF1FB", borderRadius: 999 }}>
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: "#00215D",
          borderRadius: 999,
        }}
      />
    </div>
  );
}

export default ClientFamilyView;
