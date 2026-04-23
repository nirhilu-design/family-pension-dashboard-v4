function ClientFamilyView({ reportData }) {
  const family = reportData.family || {};
  const members = reportData.members || [];

  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  return (
    <div style={{ direction: "rtl" }}>
      <h1 style={{ color: "#00215D", marginTop: 0 }}>תצוגה משפחתית</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard title="סך נכסים" value={formatCurrency(family.totalAssets)} />
        <SummaryCard title="הפקדה חודשית" value={formatCurrency(family.monthlyDeposits)} />
        <SummaryCard
          title="צבירה צפויה"
          value={formatCurrency(family.projectedLumpSumWithDeposits)}
        />
        <SummaryCard
          title="קצבה צפויה"
          value={formatCurrency(family.monthlyPensionWithDeposits)}
        />
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #DCCDBA",
          borderRadius: "18px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#00215D", marginTop: 0 }}>בני משפחה</h2>

        {members.length ? (
          members.map((member) => (
            <div
              key={member.name}
              style={{
                border: "1px solid #EEE4D8",
                borderRadius: "14px",
                padding: "14px",
                marginBottom: "12px",
                background: "#FCFBF8",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "18px", color: "#00215D" }}>
                {member.name}
              </div>
              <div style={{ marginTop: "6px", color: "#627D98" }}>
                נכסים: {formatCurrency(member.assets)}
              </div>
              <div style={{ marginTop: "4px", color: "#627D98" }}>
                קצבה צפויה: {formatCurrency(member.monthlyPensionWithDeposits)}
              </div>
            </div>
          ))
        ) : (
          <div>אין בני משפחה להצגה</div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #DCCDBA",
        borderRadius: "18px",
        padding: "18px",
      }}
    >
      <div style={{ fontSize: "13px", color: "#627D98", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ fontSize: "26px", fontWeight: 700, color: "#00215D" }}>
        {value}
      </div>
    </div>
  );
}

export default ClientFamilyView;
