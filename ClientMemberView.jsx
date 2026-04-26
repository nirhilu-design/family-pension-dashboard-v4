import { useMemo, useState } from "react";

function ClientMemberView({ member }) {
  const [productFilter, setProductFilter] = useState("all");

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

  const productFilterOptions = useMemo(() => {
    const unique = new Map();

    products.forEach((product) => {
      const name = product.productType || product.planName || "ללא סוג מוצר";
      if (!unique.has(name)) {
        unique.set(name, name);
      }
    });

    return Array.from(unique.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (productFilter === "all") return products;

    return products.filter((product) => {
      const name = product.productType || product.planName || "ללא סוג מוצר";
      return name === productFilter;
    });
  }, [products, productFilter]);

  const filteredProductDistribution = filteredProducts.map((p) => ({
    id: p.id,
    name: p.planName,
    value: p.currentValue,
  }));

  return (
    <div style={page}>
      <Header
        title={member.name}
        eyebrow="מסך לקוח · מבט אישי"
        subtitle="תצוגה אישית מתוך הדוח הפנסיוני המשפחתי המאוחד."
      />

      <section style={topGrid}>
        <KpiCard
          icon={<AssetsIcon />}
          title="סך נכסים"
          value={formatCurrency(summary.totalAssets)}
          subtext="סך הצבירה האישית"
        />

        <KpiCard
          icon={<DepositIcon />}
          title="הפקדה חודשית"
          value={formatCurrency(summary.monthlyDeposits)}
          subtext="סך ההפקדות החודשיות"
        />

        <KpiCard
          icon={<SavingsIcon />}
          title="צבירה צפויה"
          value={formatCurrency(summary.projectedLumpSumWithDeposits)}
          subtext="צבירה צפויה בגיל פרישה"
        />

        <KpiCard
          icon={<PensionIcon />}
          title="קצבה צפויה"
          value={formatCurrency(summary.monthlyPensionWithDeposits)}
          subtext="קצבה חודשית צפויה"
        />
      </section>

      <section style={lowerTwoGrid}>
        <SectionCard title="חשיפות אישיות" icon="📊">
          <div style={explanation}>
            הצגת רמות החשיפה האישיות למניות ולחו"ל לפי המוצרים המשויכים לבן המשפחה.
          </div>

          <ExposureMetricBlock
            label="חשיפה למניות"
            value={exposures.equity}
            valueText={formatPercent(exposures.equity)}
            description={getExposureLabel(exposures.equity)}
          />

          <div style={{ height: 18 }} />

          <ExposureMetricBlock
            label='חשיפה לחו"ל'
            value={exposures.foreign}
            valueText={formatPercent(exposures.foreign)}
            description={getForeignExposureLabel(exposures.foreign)}
          />
        </SectionCard>

        <SectionCard title="כיסויים ביטוחיים" icon="🛡️">
          <div style={explanation}>
            ריכוז הכיסויים הביטוחיים האישיים שנמצאו בקבצים.
          </div>

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
      </section>

      <section style={compareGrid}>
        <SectionCard title="גרף לפי גופים מנהלים" icon="🏦">
          <DonutSummaryCard
            title="חלוקה לפי גופים מנהלים"
            subtitle="התפלגות הנכסים האישיים לפי גוף מנהל."
            items={managers}
            formatCurrency={formatCurrency}
          />
        </SectionCard>

        <SectionCard title="גרף לפי מוצרים" icon="🥧">
          <DonutSummaryCard
            title="חלוקה לפי מוצרים"
            subtitle="התפלגות הנכסים האישיים לפי תוכניות ומוצרים."
            items={productDistribution}
            formatCurrency={formatCurrency}
          />
        </SectionCard>
      </section>

      <SectionCard title="חלוקה לפי גופים מנהלים" icon="📋">
        {managers.length ? (
          managers.map((item) => (
            <DataRow
              key={item.id || item.name}
              label={item.name}
              value={`${formatCurrency(item.value)} · ${formatPercent(
                item.percent
              )}`}
            />
          ))
        ) : (
          <EmptyText>אין פירוט מנהלים אישי להצגה</EmptyText>
        )}
      </SectionCard>

      <SectionCard title="מוצרים / תוכניות" icon="📄">
        <div style={productsHeaderRow}>
          <div>
            <div style={productsHeaderTitle}>פירוט מוצרים</div>
            <div style={productsHeaderSub}>
              ניתן לסנן לפי סוג מוצר ולראות את החלוקה הגרפית בהתאם.
            </div>
          </div>

          <select
            value={productFilter}
            onChange={(event) => setProductFilter(event.target.value)}
            style={productSelect}
          >
            <option value="all">כל המוצרים</option>
            {productFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={productTableVisualGrid}>
          <div style={productPieBox}>
            <MiniDonutPanel
              title="חלוקה לפי מוצרים"
              items={filteredProductDistribution}
              formatCurrency={formatCurrency}
            />
          </div>

          <div style={productTableBox}>
            {filteredProducts.length ? (
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
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
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td style={td}>{product.planName}</td>
                        <td style={td}>{product.managerName}</td>
                        <td style={td}>{product.productType}</td>
                        <td style={td}>{product.policyNo || "—"}</td>
                        <td style={td}>{formatCurrency(product.currentValue)}</td>
                        <td style={td}>{formatCurrency(product.monthlyDeposit)}</td>
                        <td style={td}>
                          {formatCurrency(product.projectedMonthlyPension)}
                        </td>
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
              <EmptyText>אין מוצרים להצגה לפי הסינון שנבחר</EmptyText>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function Header({ eyebrow, title, subtitle }) {
  return (
    <section style={heroHeader}>
      <div style={heroCenter}>
        <div style={heroEyebrow}>{eyebrow}</div>
        <h1 style={heroTitle}>{title}</h1>
        <div style={heroSubtitle}>{subtitle}</div>
      </div>
    </section>
  );
}

function KpiCard({ icon, title, value, subtext }) {
  return (
    <div style={kpiCard}>
      <div style={kpiIconWrap}>{icon}</div>
      <div style={kpiTitle}>{title}</div>
      <div style={kpiValue}>{value}</div>
      <div style={kpiSub}>{subtext}</div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <section style={sectionCard}>
      <div style={sectionHeader}>
        <div style={titleWithIcon}>
          {icon ? <span>{icon}</span> : null}
          <h2 style={h2}>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function ExposureMetricBlock({ label, value, valueText, description }) {
  return (
    <div>
      <div style={exposureTopRow}>
        <div>
          <div style={exposureLabel}>{label}</div>
          <div style={exposureDescription}>{description}</div>
        </div>

        <div style={exposureValue}>{valueText}</div>
      </div>

      <ModernBar value={value} />
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={dataRow}>
      <div style={dataLabel}>{label}</div>
      <div style={dataValue}>{value}</div>
    </div>
  );
}

function EmptyText({ children }) {
  return <div style={emptyState}>{children}</div>;
}

function ModernBar({ value }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={modernTrack}>
        <div style={{ ...modernFill, width: `${safe}%` }} />
      </div>

      <div style={barScale}>
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function DonutSummaryCard({ title, subtitle, items, formatCurrency }) {
  const data = buildSegments(items);

  if (!data.segments.length) {
    return (
      <section style={{ ...donutCard, border: "none", boxShadow: "none" }}>
        <h3 style={donutTitle}>{title}</h3>
        <div style={{ ...smallText, marginTop: 6 }}>{subtitle}</div>
        <EmptyText>אין נתונים להצגה</EmptyText>
      </section>
    );
  }

  return (
    <section style={{ ...donutCard, border: "none", boxShadow: "none" }}>
      <h3 style={donutTitle}>{title}</h3>
      <div style={{ ...smallText, marginTop: 6 }}>{subtitle}</div>

      <div style={donutLayout}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              ...donutCircle,
              background: `conic-gradient(${data.gradient})`,
            }}
          >
            <div style={donutHole} />
          </div>
        </div>

        <div style={legendList}>
          {data.segments.slice(0, 6).map((seg, index) => (
            <LegendRow
              key={`${seg.id || seg.name}-${index}`}
              seg={seg}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniDonutPanel({ title, items, formatCurrency }) {
  const data = buildSegments(items);

  return (
    <div>
      <div style={miniPanelTitle}>{title}</div>

      {!data.segments.length ? (
        <EmptyText>אין נתונים להצגה</EmptyText>
      ) : (
        <>
          <div style={miniDonutWrap}>
            <div
              style={{
                ...miniDonutCircle,
                background: `conic-gradient(${data.gradient})`,
              }}
            >
              <div style={miniDonutHole} />
            </div>
          </div>

          <div style={miniLegendList}>
            {data.segments.slice(0, 5).map((seg, index) => (
              <LegendRow
                key={`${seg.id || seg.name}-${index}`}
                seg={seg}
                formatCurrency={formatCurrency}
                compact
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function buildSegments(items) {
  const safeItems = Array.isArray(items)
    ? items.filter((item) => Number(item.value || 0) > 0)
    : [];

  const total = safeItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (!safeItems.length || total <= 0) {
    return { segments: [], gradient: "#D7DEE7 0% 100%" };
  }

  let current = 0;

  const segments = safeItems.map((item, index) => {
    const value = Number(item.value || 0);
    const percent = (value / total) * 100;
    const start = current;
    const end = current + percent;
    current = end;

    return {
      ...item,
      value,
      percent,
      start,
      end,
      color: chartColors[index % chartColors.length],
    };
  });

  const gradient = segments
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(", ");

  return { segments, gradient };
}

function LegendRow({ seg, formatCurrency, compact = false }) {
  return (
    <div style={compact ? miniLegendRow : legendRow}>
      <span style={{ ...legendDot, background: seg.color }} />
      <div style={{ minWidth: 0 }}>
        <div style={legendName}>{seg.name}</div>
        <div style={legendSub}>{formatCurrency(seg.value)}</div>
      </div>
      <div style={legendPercent}>{seg.percent.toFixed(1)}%</div>
    </div>
  );
}

function ExposureBadge({ value }) {
  const num = Number(value || 0);

  const color = num > 60 ? "#D14343" : num > 30 ? "#F0B43C" : "#3EAF63";

  return (
    <span style={{ color, fontWeight: 800 }}>
      {num > 0 ? `${num.toFixed(1)}%` : "—"}
    </span>
  );
}

function getExposureLabel(value) {
  const num = Number(value || 0);
  if (num <= 30) return "חשיפה נמוכה";
  if (num <= 60) return "חשיפה בינונית";
  return "חשיפה גבוהה";
}

function getForeignExposureLabel(value) {
  const num = Number(value || 0);
  if (num <= 25) return "חשיפה נמוכה לחו״ל";
  if (num <= 50) return "חשיפה בינונית לחו״ל";
  return "חשיפה גבוהה לחו״ל";
}

function formatDate(value) {
  if (!value) return "—";
  const str = String(value).trim();

  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    return `${d}/${m}/${y}`;
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("he-IL").format(date);
  }

  return str;
}

function AssetsIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M4 18V9" stroke="#00215D" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 18V5" stroke="#00215D" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 18V12" stroke="#00215D" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M3 19H21" stroke="#FF2756" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function DepositIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M12 3V14" stroke="#FF2756" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M8.5 6.5L12 3L15.5 6.5"
        stroke="#FF2756"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="14" width="16" height="6" rx="2" stroke="#00215D" strokeWidth="2.2" />
    </svg>
  );
}

function SavingsIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12C5 8.7 8.1 6 12 6C15.9 6 19 8.7 19 12C19 15.3 15.9 18 12 18C8.1 18 5 15.3 5 12Z"
        stroke="#00215D"
        strokeWidth="2.2"
      />
      <path d="M12 8.5V15.5" stroke="#FF2756" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9.7 10.5H13.2C14.1 10.5 14.7 11 14.7 11.8C14.7 12.6 14.1 13.1 13.2 13.1H10.8" stroke="#FF2756" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function PensionIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 20V8L12 4L18 8V20"
        stroke="#00215D"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M9 20V13H15V20" stroke="#FF2756" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M4 20H20" stroke="#00215D" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const theme = {
  pageBg: "#F9F7F3",
  surface: "#FFFFFF",
  surfaceAlt: "#FCFBF8",
  border: "#E2D1BF",
  divider: "#EEE4D8",
  text: "#102A43",
  textSoft: "#627D98",
  navy: "#00215D",
  navyDark: "#001845",
  accent: "#FF2756",
  softBlue: "#EAF1FB",
};

const chartColors = [
  "#00215D",
  "#FF2756",
  "#1F77B4",
  "#43B5D9",
  "#8F63C9",
  "#F0B43C",
  "#9FD0E6",
  "#8FB996",
  "#C08497",
  "#7B8CBF",
];

const page = {
  direction: "rtl",
  fontFamily: 'Calibri, "Arial", sans-serif',
  fontSize: 12,
  lineHeight: 1.6,
  color: theme.text,
};

const heroHeader = {
  background: `linear-gradient(135deg, ${theme.navy}, ${theme.navyDark})`,
  color: "#fff",
  borderRadius: 24,
  padding: "24px 26px",
  boxShadow: "0 8px 28px rgba(0,33,93,0.14)",
  marginBottom: 18,
};

const heroCenter = {
  textAlign: "center",
};

const heroEyebrow = {
  fontSize: 12,
  color: "rgba(255,255,255,0.78)",
  marginBottom: 8,
  fontWeight: 700,
};

const heroTitle = {
  margin: 0,
  fontSize: 30,
  fontWeight: 700,
  lineHeight: 1.2,
  color: "#fff",
};

const heroSubtitle = {
  margin: "12px auto 0",
  maxWidth: 760,
  fontSize: 12,
  lineHeight: 1.8,
  color: "rgba(255,255,255,0.9)",
};

const topGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 18,
  marginBottom: 18,
};

const lowerTwoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  marginBottom: 18,
};

const compareGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  marginBottom: 18,
};

const kpiCard = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 20,
  padding: 20,
  minHeight: 188,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
};

const kpiIconWrap = {
  width: 74,
  height: 74,
  borderRadius: 22,
  background: "#F4F7FB",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 14,
};

const kpiTitle = {
  fontSize: 14,
  color: theme.textSoft,
  fontWeight: 700,
  marginBottom: 10,
};

const kpiValue = {
  fontSize: 34,
  lineHeight: 1.1,
  fontWeight: 700,
  color: theme.navy,
  marginBottom: 10,
};

const kpiSub = {
  fontSize: 12,
  color: "#7A8CA8",
  lineHeight: 1.7,
  maxWidth: 260,
  margin: "0 auto",
};

const sectionCard = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
  marginBottom: 18,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const titleWithIcon = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const h2 = {
  margin: 0,
  fontSize: 14,
  color: theme.navy,
  fontWeight: 700,
  lineHeight: 1.4,
};

const explanation = {
  fontSize: 12,
  color: theme.textSoft,
  lineHeight: 1.7,
  marginBottom: 16,
};

const dataRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 0",
  borderBottom: `1px solid ${theme.divider}`,
  fontSize: 12,
};

const dataLabel = {
  color: theme.textSoft,
};

const dataValue = {
  color: theme.navy,
  fontWeight: 700,
};

const exposureTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  marginBottom: 10,
};

const exposureLabel = {
  fontSize: 12,
  color: theme.textSoft,
  fontWeight: 700,
};

const exposureDescription = {
  fontSize: 14,
  color: theme.navy,
  fontWeight: 700,
  marginTop: 4,
};

const exposureValue = {
  fontSize: 34,
  color: theme.navy,
  fontWeight: 700,
  lineHeight: 1.1,
};

const modernTrack = {
  position: "relative",
  height: 16,
  borderRadius: 999,
  background:
    "linear-gradient(90deg, #F9F7F3 0%, #EAF1FB 45%, #E2D1BF 75%, #00215D 100%)",
  overflow: "hidden",
};

const modernFill = {
  height: "100%",
  borderRadius: 999,
  background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.navy} 100%)`,
  boxShadow: "0 1px 3px rgba(0,33,93,0.25)",
};

const barScale = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 10,
  fontSize: 12,
  color: theme.textSoft,
  direction: "ltr",
};

const donutCard = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 20,
  padding: 0,
  minHeight: "auto",
};

const donutTitle = {
  margin: 0,
  color: theme.navy,
  fontSize: 14,
  fontWeight: 700,
};

const smallText = {
  fontSize: 12,
  color: theme.textSoft,
  lineHeight: 1.6,
};

const donutLayout = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: 20,
  alignItems: "center",
  marginTop: 12,
};

const donutCircle = {
  width: 170,
  height: 170,
  borderRadius: "50%",
  position: "relative",
  flexShrink: 0,
};

const donutHole = {
  position: "absolute",
  inset: 34,
  background: "#fff",
  borderRadius: "50%",
  border: `1px solid ${theme.divider}`,
};

const legendList = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const legendRow = {
  display: "grid",
  gridTemplateColumns: "12px 1fr auto",
  gap: 8,
  alignItems: "center",
  fontSize: 12,
};

const miniLegendRow = {
  display: "grid",
  gridTemplateColumns: "10px 1fr auto",
  gap: 7,
  alignItems: "center",
  fontSize: 11,
};

const legendDot = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  display: "inline-block",
};

const legendName = {
  color: theme.text,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const legendSub = {
  color: theme.textSoft,
  fontSize: 11,
  marginTop: 2,
};

const legendPercent = {
  color: theme.navy,
  fontWeight: 700,
};

const productsHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
  marginBottom: 16,
};

const productsHeaderTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: theme.navy,
};

const productsHeaderSub = {
  fontSize: 12,
  color: theme.textSoft,
  marginTop: 4,
};

const productSelect = {
  minWidth: 220,
  minHeight: 42,
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  background: "#fff",
  color: theme.navy,
  fontWeight: 800,
  fontFamily: 'Calibri, "Arial", sans-serif',
  fontSize: 12,
};

const productTableVisualGrid = {
  display: "grid",
  gridTemplateColumns: "250px minmax(0, 1fr)",
  gap: 16,
  alignItems: "start",
};

const productPieBox = {
  background: theme.surfaceAlt,
  border: `1px solid ${theme.divider}`,
  borderRadius: 16,
  padding: 14,
};

const productTableBox = {
  minWidth: 0,
};

const miniPanelTitle = {
  fontSize: 13,
  fontWeight: 800,
  color: theme.navy,
  marginBottom: 12,
};

const miniDonutWrap = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 14,
};

const miniDonutCircle = {
  width: 150,
  height: 150,
  borderRadius: "50%",
  position: "relative",
};

const miniDonutHole = {
  position: "absolute",
  inset: 31,
  background: theme.surfaceAlt,
  borderRadius: "50%",
  border: `1px solid ${theme.divider}`,
};

const miniLegendList = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const tableWrap = {
  overflowX: "auto",
  borderRadius: 14,
  border: `1px solid ${theme.divider}`,
  background: "#fff",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1040,
  background: "#fff",
};

const th = {
  textAlign: "right",
  padding: 12,
  fontSize: 12,
  color: theme.textSoft,
  borderBottom: `1px solid ${theme.divider}`,
  whiteSpace: "nowrap",
  fontWeight: 700,
  background: "#FAF8F4",
};

const td = {
  textAlign: "right",
  padding: 12,
  fontSize: 12,
  color: theme.text,
  borderBottom: "1px solid #F0E6DA",
  whiteSpace: "nowrap",
};

const emptyState = {
  background: theme.surfaceAlt,
  border: `1px dashed ${theme.border}`,
  borderRadius: 14,
  padding: 18,
  fontSize: 12,
  color: theme.textSoft,
  lineHeight: 1.7,
};

export default ClientMemberView;
