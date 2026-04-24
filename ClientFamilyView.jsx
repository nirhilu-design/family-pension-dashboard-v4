function ClientFamilyView({ clientModel }) {
  const summary = clientModel.summary || {};
  const exposures = clientModel.exposures || {};
  const members = clientModel.members || [];
  const managers = clientModel.distributions?.managers || [];
  const products = clientModel.distributions?.products || [];

  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  return (
    <div>
      <Header
        title="דשבורד משפחתי"
        subtitle="תמונה מאוחדת של כלל הנכסים, ההפקדות, התחזיות והחשיפות של התא המשפחתי."
      />

      <Grid4>
        <SummaryCard title="סך נכסים משפחתי" value={formatCurrency(summary.totalAssets)} />
        <SummaryCard title="הפקדה חודשית" value={formatCurrency(summary.monthlyDeposits)} />
        <SummaryCard title="צבירה צפויה" value={formatCurrency(summary.projectedLumpSumWithDeposits)} />
        <SummaryCard title="קצבה צפויה" value={formatCurrency(summary.monthlyPensionWithDeposits)} />
      </Grid4>

      <Grid2>
        <SectionCard title="חשיפות משפחתיות">
          <DataRow label="חשיפה למניות" value={formatPercent(exposures.equity)} />
          <DataRow label='חשיפה לחו"ל' value={formatPercent(exposures.foreign)} />

          <div style={{ marginTop: 18 }}>
            <SimpleBar label="מניות" value={exposures.equity} />
            <SimpleBar label='חו"ל' value={exposures.foreign} />
          </div>
        </SectionCard>

        <SectionCard title="חלוקה לפי גופים מנהלים">
          <DonutChart items={managers} />
        </SectionCard>
      </Grid2>

      <SectionCard title="בני משפחה">
        {members.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            {members.map((member) => (
              <div key={member.id} style={memberCard}>
                <div style={memberTitle}>{member.name}</div>
                <DataRow label="סך נכסים" value={formatCurrency(member.summary.totalAssets)} />
                <DataRow label="הפקדה חודשית" value={formatCurrency(member.summary.monthlyDeposits)} />
                <DataRow label="קצבה צפויה" value={formatCurrency(member.summary.monthlyPensionWithDeposits)} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyText>אין בני משפחה להצגה</EmptyText>
        )}
      </SectionCard>

      <Grid2>
        <SectionCard title="חלוקה לפי סוגי מוצרים">
          <DonutChart items={products} />
        </SectionCard>

        <SectionCard title="רשימת גופים מנהלים">
          {managers.length ? (
            managers.map((item) => (
              <DataRow
                key={item.id}
                label={item.name}
                value={`${formatCurrency(item.value)} · ${formatPercent(item.percent)}`}
              />
            ))
          ) : (
            <EmptyText>אין נתוני גופים מנהלים להצגה</EmptyText>
          )}
        </SectionCard>
      </Grid2>
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div style={header}>
      <h1 style={{ margin: 0, fontSize: 32 }}>{title}</h1>
      <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.8, opacity: 0.9 }}>
        {subtitle}
      </div>
    </div>
  );
}

function Grid4({ children }) {
  return <div style={grid4}>{children}</div>;
}

function Grid2({ children }) {
  return <div style={grid2}>{children}</div>;
}

function SummaryCard({ title, value }) {
  return (
    <div style={summaryCard}>
      <div style={summaryTitle}>{title}</div>
      <div style={summaryValue}>{value}</div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section style={sectionCard}>
      <h2 style={sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={dataRow}>
      <div style={{ color: "#627D98" }}>{label}</div>
      <div style={{ color: "#00215D", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function EmptyText({ children }) {
  return <div style={{ color: "#627D98", fontSize: 14 }}>{children}</div>;
}

function SimpleBar({ label, value }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#627D98", fontSize: 13 }}>{label}</span>
        <span style={{ color: "#00215D", fontWeight: 700 }}>{safe.toFixed(1)}%</span>
      </div>
      <div style={{ height: 14, borderRadius: 999, background: "#EAF1FB", overflow: "hidden" }}>
        <div
          style={{
            width: `${safe}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, #43B5D9, #1F77B4)",
          }}
        />
      </div>
    </div>
  );
}

function DonutChart({ items }) {
  const safeItems = Array.isArray(items) ? items.filter((i) => Number(i.value || 0) > 0) : [];
  const colors = ["#00215D", "#1F77B4", "#43B5D9", "#8F63C9", "#F0B43C", "#F07C8A", "#8FB996"];
  const total = safeItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (!safeItems.length || total <= 0) {
    return <EmptyText>אין נתונים להצגה</EmptyText>;
  }

  let current = 0;
  const segments = safeItems.map((item, index) => {
    const value = Number(item.value || 0);
    const start = current;
    const percent = (value / total) * 100;
    const end = start + percent;
    current = end;

    return {
      ...item,
      percent,
      color: colors[index % colors.length],
      start,
      end,
    };
  });

  const gradient = segments
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(", ");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20, alignItems: "center" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: "50%",
            background: `conic-gradient(${gradient})`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 34,
              background: "#fff",
              borderRadius: "50%",
              border: "1px solid #EEE4D8",
            }}
          />
        </div>
      </div>

      <div>
        {segments.map((seg) => (
          <div key={seg.id || seg.name} style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: seg.color }} />
            <span style={{ color: "#102A43", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {seg.name}
            </span>
            <span style={{ color: "#00215D", fontWeight: 700 }}>{seg.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const header = {
  background: "linear-gradient(135deg, #0D347A, #00215D)",
  color: "#fff",
  borderRadius: 24,
  padding: 28,
  marginBottom: 22,
};

const grid4 = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const summaryCard = {
  background: "#ffffff",
  border: "1px solid #DCCDBA",
  borderRadius: 18,
  padding: 18,
  minHeight: 120,
};

const summaryTitle = {
  fontSize: 13,
  color: "#627D98",
  marginBottom: 8,
};

const summaryValue = {
  fontSize: 26,
  fontWeight: 700,
  color: "#00215D",
};

const sectionCard = {
  background: "#ffffff",
  border: "1px solid #DCCDBA",
  borderRadius: 18,
  padding: 20,
  marginBottom: 18,
};

const sectionTitle = {
  marginTop: 0,
  color: "#00215D",
  fontSize: 18,
};

const dataRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid #EEE4D8",
  fontSize: 14,
};

const memberCard = {
  border: "1px solid #EEE4D8",
  borderRadius: 16,
  padding: 16,
  background: "#FCFBF8",
};

const memberTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#00215D",
  marginBottom: 10,
};

export default ClientFamilyView;
