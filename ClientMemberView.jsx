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

  return (
    <div>
      <Header
        title={member.name}
        subtitle="תצוגה אישית מתוך הדוח המשפחתי המאוחד."
      />

      <Grid4>
        <SummaryCard title="סך נכסים" value={formatCurrency(summary.totalAssets)} />
        <SummaryCard
          title="הפקדה חודשית"
          value={formatCurrency(summary.monthlyDeposits)}
        />
        <SummaryCard
          title="צבירה צפויה"
          value={formatCurrency(summary.projectedLumpSumWithDeposits)}
        />
        <SummaryCard
          title="קצבה צפויה"
          value={formatCurrency(summary.monthlyPensionWithDeposits)}
        />
      </Grid4>

      <Grid2>
        <SectionCard title="חשיפות אישיות">
          <DataRow label="חשיפה למניות" value={formatPercent(exposures.equity)} />
          <DataRow label='חשיפה לחו"ל' value={formatPercent(exposures.foreign)} />
        </SectionCard>

        <SectionCard title="כיסויים ביטוחיים">
          <DataRow
            label="ביטוח חיים"
            value={formatCurrency(insurance.deathCoverage)}
          />
          <DataRow
            label="אובדן כושר עבודה"
            value={formatCurrency(insurance.disabilityValue)}
          />
          <DataRow
            label="אחוז אובדן כושר עבודה"
            value={formatPercent(insurance.disabilityPercent)}
          />
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
          <EmptyText>
            עדיין אין פירוט מנהלים אישי. בשלב הבא נחבר את זה לפירוט המוצרים מה־XML.
          </EmptyText>
        )}
      </SectionCard>

      <SectionCard title="מוצרים / תוכניות">
        {products.length ? (
          products.map((product) => (
            <div
              key={product.id}
              style={{
                border: "1px solid #EEE4D8",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                background: "#FCFBF8",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: "#00215D",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                {product.planName}
              </div>

              <DataRow label="גוף מנהל" value={product.managerName} />
              <DataRow label="סוג מוצר" value={product.productType} />
              <DataRow
                label="צבירה"
                value={formatCurrency(product.currentValue)}
              />
              <DataRow
                label="הפקדה חודשית"
                value={formatCurrency(product.monthlyDeposit)}
              />
            </div>
          ))
        ) : (
          <EmptyText>
            עדיין אין פירוט מוצרים אישי. זה השלב הבא שנחבר מתוך מבנה ה־Parser.
          </EmptyText>
        )}
      </SectionCard>
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0D347A, #00215D)",
        color: "#fff",
        borderRadius: 24,
        padding: 28,
        marginBottom: 22,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 32 }}>{title}</h1>
      <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.8, opacity: 0.9 }}>
        {subtitle}
      </div>
    </div>
  );
}

function Grid4({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 16,
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 16,
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #DCCDBA",
        borderRadius: 18,
        padding: 18,
        minHeight: 120,
      }}
    >
      <div style={{ fontSize: 13, color: "#627D98", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#00215D" }}>
        {value}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #DCCDBA",
        borderRadius: 18,
        padding: 20,
        marginBottom: 18,
      }}
    >
      <h2 style={{ marginTop: 0, color: "#00215D", fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

function DataRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #EEE4D8",
        fontSize: 14,
      }}
    >
      <div style={{ color: "#627D98" }}>{label}</div>
      <div style={{ color: "#00215D", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function EmptyText({ children }) {
  return <div style={{ color: "#627D98", fontSize: 14 }}>{children}</div>;
}

export default ClientMemberView;
