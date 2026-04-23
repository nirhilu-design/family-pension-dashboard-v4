function ClientMemberView({ member }) {
  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  if (!member) {
    return <div style={{ direction: "rtl" }}>לא נמצא בן משפחה</div>;
  }

  return (
    <div style={{ direction: "rtl" }}>
      <h1 style={{ color: "#00215D", marginTop: 0 }}>{member.name}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard title="סך נכסים" value={formatCurrency(member.assets)} />
        <SummaryCard title="הפקדה חודשית" value={formatCurrency(member.monthlyDeposits)} />
        <SummaryCard title="צבירה צפויה" value={formatCurrency(member.lumpSumWithDeposits)} />
        <SummaryCard
          title="קצבה צפויה"
          value={formatCurrency(member.monthlyPensionWithDeposits)}
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
        <h2 style={{ color: "#00215D", marginTop: 0 }}>פרטים אישיים</h2>

        <div style={{ marginBottom: "8px", color: "#627D98" }}>
          ביטוח חיים: {formatCurrency(member.deathCoverage)}
        </div>

        <div style={{ marginBottom: "8px", color: "#627D98" }}>
          אובדן כושר עבודה: {formatCurrency(member.disabilityValue)}
        </div>

        <div style={{ marginBottom: "8px", color: "#627D98" }}>
          אחוז נכות: {member.disabilityPercent || 0}%
        </div>
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

export default ClientMemberView;
