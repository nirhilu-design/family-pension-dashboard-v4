function ClientMemberView({ member }) {
  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  if (!member) {
    return <div style={{ direction: "rtl" }}>לא נמצא בן משפחה</div>;
  }

  const summary = member.summary || {};
  const insurance = member.insurance || {};
  const exposures = member.exposures || {};
  const products = member.products || [];
  const managers = member.managers || [];

  const productDistribution = products.map((p) => ({
    id: p.id,
    name: p.planName,
    value: p.currentValue,
  }));

  return (
    <div>
      <Header
        title={member.name}
        subtitle="תצוגה אישית מתוך הדוח המשפחתי המאוחד."
      />

      <Grid4>
        <SummaryCard title="סך נכסים" value={formatCurrency(summary.totalAssets)} />
        <SummaryCard title="הפקדה חודשית" value={formatCurrency(summary.monthlyDeposits)} />
        <SummaryCard title="צבירה צפויה" value={formatCurrency(summary.projectedLumpSumWithDeposits)} />
        <SummaryCard title="קצבה צפויה" value={formatCurrency(summary.monthlyPensionWithDeposits)} />
      </Grid4>

      <Grid2>
        <SectionCard title="חשיפות אישיות">
          <DataRow label="חשיפה למניות" value={formatPercent(exposures.equity)} />
          <DataRow label='חשיפה לחו"ל' value={formatPercent(exposures.foreign)} />

          <div style={{ marginTop: 18 }}>
            <SimpleBar label="מניות" value={exposures.equity} />
            <SimpleBar label='חו"ל' value={exposures.foreign} />
          </div>
        </SectionCard>

        <SectionCard title="כיסויים ביטוחיים">
          <DataRow label="ביטוח חיים" value={formatCurrency(insurance.deathCoverage)} />
          <DataRow label="אובדן כושר עבודה" value={formatCurrency(insurance.disabilityValue)} />
          <DataRow label="אחוז אובדן כושר עבודה" value={formatPercent(insurance.disabilityPercent)} />
        </SectionCard>
      </Grid2>

      <Grid2>
        <SectionCard title="גרף לפי גופים מנהלים">
          <DonutChart items={managers} />
        </SectionCard>

        <SectionCard title="גרף לפי מוצרים">
          <DonutChart items={productDistribution} />
        </SectionCard>
      </Grid2>

      <SectionCard title="חלוקה לפי גופים מנהלים">
        {managers.length ? (
          managers.map((item) => (
            <DataRow
              key={item.id}
              label={item.name}
              value={`${formatCurrency(item.value)} · ${formatPercent(item.percent)}`}
            />
          ))
        ) : (
          <EmptyText>אין פירוט מנהלים אישי להצגה</EmptyText>
        )}
      </SectionCard>

      <SectionCard title="מוצרים / תוכניות">
        {products.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={{ background: "#F7F5F1" }}>
                  <th style={th}>מוצר</th>
                  <th style={th}>גוף מנהל</th>
                  <th style={th}>סוג מוצר</th>
                  <th style={th}>מספר פוליסה</th>
                  <th style={th}>צבירה</th>
                  <th style={th}>הפקדה חודשית</th>
                  <th style={th}>קצבה צפויה</th>
                  <th style={th}>דמי ניהול מצבירה</th>
                  <th style={th}>חשיפה מנייתית</th>
                  <th style={th}>חשיפה לחו"ל</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td style={td}>{product.planName}</td>
                    <td style={td}>{product.managerName}</td>
                    <td style={td}>{product.productType}</td>
                    <td style={td}>{product.policyNo || "—"}</td>
                    <td style={td}>{formatCurrency(product.currentValue)}</td>
                    <td style={td}>{formatCurrency(product.monthlyDeposit)}</td>
                    <td style={td}>{formatCurrency(product.projectedMonthlyPension)}</td>
                    <td style={td}>
                      {Number(product.managementFeeFromBalance || 0).toFixed(2)}%
                    </td>
                    <td style={td}>
                      <ExposureBadge value={product.equityExposure} />
                    </td>
                    <td style={td}>
                      <ExposureBadge value={product.foreignExposure} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyText>אין פירוט מוצרים להצגה</EmptyText>
        )}
      </SectionCard>
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

function ExposureBadge({ value }) {
  const num = Number(value || 0);

  const color =
    num > 60 ? "#D14343" : num > 30 ? "#F0B43C" : "#3EAF63";

  return (
    <span style={{ color, fontWeight: 800 }}>
      {num > 0 ? `${num.toFixed(1)}%` : "—"}
    </span>
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

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1100,
  background: "#fff",
  border: "1px solid #EEE4D8",
  borderRadius: 12,
  overflow: "hidden",
};

const th = {
  textAlign: "right",
  padding: 12,
  fontSize: 13,
  color: "#627D98",
  borderBottom: "1px solid #EEE4D8",
  whiteSpace: "nowrap",
};

const td = {
  textAlign: "right",
  padding: 12,
  fontSize: 14,
  color: "#102A43",
  borderBottom: "1px solid #F0E6DA",
  whiteSpace: "nowrap",
};

export default ClientMemberView;
