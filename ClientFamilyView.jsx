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
    <div style={page}>
      <Header
        title="דוח פנסיוני משפחתי מאוחד"
        eyebrow="מסך לקוח · מבט משפחתי"
        subtitle="ריכזנו עבורך תמונת מצב משפחתית אחת הכוללת את כלל הנכסים הפנסיוניים, תחזית פרישה, פיזור בין מוצרים וגופים מנהלים, חשיפות ומידע מרכזי לכל אחד מבני המשפחה."
      />

      <section style={topGrid}>
        <KpiCard
          icon={<GiftIcon />}
          title="סך נכסים"
          value={formatCurrency(summary.totalAssets)}
          subtext="סך הצבירה הכולל של התא המשפחתי"
        />

        <KpiCard
          icon={<DepositIcon />}
          title="הפקדה חודשית"
          value={formatCurrency(summary.monthlyDeposits)}
          subtext="סך ההפקדות החודשיות של בני המשפחה"
        />

        <KpiCard
          icon={<PensionIcon />}
          title="צבירה צפויה"
          value={formatCurrency(summary.projectedLumpSumWithDeposits)}
          subtext="צבירה צפויה בגיל פרישה"
        />

        <KpiCard
          icon={<MonthlyIcon />}
          title="קצבה צפויה"
          value={formatCurrency(summary.monthlyPensionWithDeposits)}
          subtext="קצבה חודשית צפויה בגיל פרישה"
        />
      </section>

      <section style={fullWidthSection}>
        <SectionCard title="חלוקה לפי מוצרים" icon="🥧">
          <FullWidthDonutCard
            items={products}
            formatCurrency={formatCurrency}
            emptyText="אין נתוני מוצרים להצגה"
          />
        </SectionCard>
      </section>

      <section style={fullWidthSection}>
        <SectionCard title="חלוקה לפי גופים מנהלים" icon="🏦">
          <FullWidthDonutCard
            items={managers}
            formatCurrency={formatCurrency}
            emptyText="אין נתוני גופים מנהלים להצגה"
          />
        </SectionCard>
      </section>

      <section style={lowerTwoGrid}>
        <SectionCard title='חשיפה לחו"ל' icon="🌍">
          <div style={explanation}>
            התרשים מציג את החשיפה המשפחתית לחו"ל לפי הנתונים שעובדו מהקבצים.
          </div>

          <DataRow label='חשיפה לחו"ל' value={formatPercent(exposures.foreign)} />
          <ModernBar value={exposures.foreign} />
        </SectionCard>

        <SectionCard title="חשיפה מנייתית משוקללת" icon="📊">
          <div style={explanation}>
            המדד מציג את רמת החשיפה למניות ברמת התא המשפחתי.
          </div>

          <div style={equityValueWrap}>
            <div style={equityValue}>{formatPercent(exposures.equity)}</div>
            <div style={equityLabel}>{getExposureLabel(exposures.equity)}</div>
          </div>

          <ModernBar value={exposures.equity} />
        </SectionCard>
      </section>

      <section style={bottomGrid}>
        <SectionCard title="סיכום מהיר" icon="🧾">
          <div style={summaryStatsGrid}>
            <SmallStat title="מוצרים" value={products.length} />
            <SmallStat title="גופים מנהלים" value={managers.length} />
            <SmallStat title="בני משפחה" value={members.length} />
            <SmallStat
              title="חשיפה מנייתית"
              value={formatPercent(exposures.equity)}
            />
          </div>

          <InfoBox
            label="קצבה חודשית צפויה"
            value={formatCurrency(summary.monthlyPensionWithDeposits)}
          />

          <InfoBox
            label="צבירה צפויה בגיל פרישה"
            value={formatCurrency(summary.projectedLumpSumWithDeposits)}
          />
        </SectionCard>

        <SectionCard title="רשימת גופים מנהלים" icon="📋">
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
            <EmptyText>אין נתוני גופים מנהלים להצגה</EmptyText>
          )}
        </SectionCard>
      </section>

      <SectionCard title="פירוט לפי בני משפחה" icon="👨‍👩‍👧‍👦">
        <div style={explanation}>
          מוצגת תמונת מצב אישית לכל אחד מבני המשפחה, כולל צבירה, הפקדה, קצבה
          צפויה, סכום חד הוני וכיסויים ביטוחיים.
        </div>

        {members.length ? (
          <div style={membersGrid}>
            {members.map((member) => (
              <div key={member.id || member.name} style={memberCard}>
                <div style={memberTop}>
                  <div>
                    <div style={memberName}>{member.name}</div>
                  </div>

                  <div style={chip}>
                    הפקדה חודשית:{" "}
                    {formatCurrency(member.summary?.monthlyDeposits)}
                  </div>
                </div>

                <div style={centerCard}>
                  <div style={centerLabel}>סך צבירה</div>
                  <div style={centerValue}>
                    {formatCurrency(member.summary?.totalAssets)}
                  </div>
                </div>

                <div style={miniGrid}>
                  <CompareMiniCard
                    title="קצבה חודשית צפויה"
                    leftLabel="עם הפקדות"
                    leftValue={formatCurrency(
                      member.summary?.monthlyPensionWithDeposits
                    )}
                    rightLabel="ללא הפקדות"
                    rightValue={formatCurrency(
                      member.summary?.monthlyPensionWithoutDeposits
                    )}
                  />

                  <CompareMiniCard
                    title="סכום חד הוני לפרישה"
                    leftLabel="עם הפקדות"
                    leftValue={formatCurrency(
                      member.summary?.projectedLumpSumWithDeposits
                    )}
                    rightLabel="ללא הפקדות"
                    rightValue={formatCurrency(
                      member.summary?.projectedLumpSumWithoutDeposits
                    )}
                  />
                </div>

                <div style={insuranceGrid}>
                  <div style={insuranceCard}>
                    <div style={insuranceLabel}>🛡️ ביטוח חיים</div>
                    <div style={insuranceValue}>
                      {formatCurrency(member.insurance?.deathCoverage)}
                    </div>
                  </div>

                  <div style={insuranceCard}>
                    <div style={insuranceLabel}>🧍 אובדן כושר עבודה</div>
                    <div style={insuranceValue}>
                      {formatCurrency(member.insurance?.disabilityValue)} (
                      {Number(member.insurance?.disabilityPercent || 0).toFixed(
                        1
                      )}
                      %)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyText>אין בני משפחה להצגה</EmptyText>
        )}
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

function FullWidthDonutCard({ items, formatCurrency, emptyText }) {
  const safeItems = Array.isArray(items)
    ? items.filter((item) => Number(item.value || 0) > 0)
    : [];

  const total = safeItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  if (!safeItems.length || total <= 0) {
    return <EmptyText>{emptyText}</EmptyText>;
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
      percent,
      start,
      end,
      color: chartColors[index % chartColors.length],
    };
  });

  const gradient = segments
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(", ");

  return (
    <div style={fullDonutLayout}>
      <div style={donutRight}>
        <div style={donut3dShadow}>
          <div style={{ ...donut3d, background: `conic-gradient(${gradient})` }}>
            <div style={donut3dHole} />
          </div>
        </div>
      </div>

      <div style={donutLegendLeft}>
        {segments.map((seg, index) => (
          <div key={`${seg.id || seg.name}-${index}`} style={breakdownItem}>
            <span style={{ ...breakdownDot, background: seg.color }} />

            <div style={{ minWidth: 0 }}>
              <div style={breakdownName}>{seg.name}</div>
              <div style={breakdownSub}>{formatCurrency(seg.value)}</div>
            </div>

            <div style={breakdownPercent}>{seg.percent.toFixed(1)}%</div>
          </div>
        ))}
      </div>
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

function SmallStat({ title, value }) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{title}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={simpleInfoBox}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{value}</div>
    </div>
  );
}

function CompareMiniCard({ title, leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <div style={compareMiniCard}>
      <div style={compareMiniTitle}>{title}</div>

      <div style={compareMiniInner}>
        <div style={compareMiniSide}>
          <div style={compareMiniSideLabel}>{leftLabel}</div>
          <div style={compareMiniSideValue}>{leftValue}</div>
        </div>

        <div style={dividerLine} />

        <div style={compareMiniSide}>
          <div style={compareMiniSideLabel}>{rightLabel}</div>
          <div style={compareMiniSideValue}>{rightValue}</div>
        </div>
      </div>
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

function getExposureLabel(value) {
  const num = Number(value || 0);

  if (num <= 30) return "חשיפה נמוכה";
  if (num <= 60) return "חשיפה בינונית";
  return "חשיפה גבוהה";
}

function GiftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="7"
        width="16"
        height="13"
        rx="2"
        stroke="#00215D"
        strokeWidth="2"
      />
      <path d="M12 7V20" stroke="#00215D" strokeWidth="2" />
      <path d="M4 11H20" stroke="#00215D" strokeWidth="2" />
      <path
        d="M9 7C7.8 7 7 6.2 7 5C7 3.8 7.8 3 9 3C10.8 3 12 5 12 7"
        stroke="#00215D"
        strokeWidth="2"
      />
      <path
        d="M15 7C16.2 7 17 6.2 17 5C17 3.8 16.2 3 15 3C13.2 3 12 5 12 7"
        stroke="#00215D"
        strokeWidth="2"
      />
    </svg>
  );
}

function DepositIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3V14"
        stroke="#FF2756"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M8.5 6.5L12 3L15.5 6.5"
        stroke="#FF2756"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="14"
        width="16"
        height="6"
        rx="2"
        stroke="#FF2756"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function PensionIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 19H19"
        stroke="#00215D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 16L11 12L14 14L18 8"
        stroke="#00215D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8H14"
        stroke="#FF2756"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 8V12"
        stroke="#FF2756"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MonthlyIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="3"
        stroke="#00215D"
        strokeWidth="2"
      />
      <path
        d="M8 10H16"
        stroke="#FF2756"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 14H13"
        stroke="#00215D"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.4,
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

const fullWidthSection = {
  width: "100%",
  marginBottom: 18,
};

const lowerTwoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  marginBottom: 18,
};

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "0.9fr 1.1fr",
  gap: 18,
  alignItems: "start",
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
  flexShrink: 0,
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

const fullDonutLayout = {
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: 26,
  alignItems: "center",
  direction: "rtl",
};

const donutRight = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const donut3dShadow = {
  width: 250,
  height: 250,
  borderRadius: "50%",
  background: "linear-gradient(180deg, rgba(0,33,93,0.18), rgba(0,0,0,0.05))",
  padding: 10,
  boxShadow: "0 18px 34px rgba(0,33,93,0.14)",
};

const donut3d = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  position: "relative",
  boxShadow:
    "inset 0 12px 18px rgba(255,255,255,0.35), inset 0 -16px 24px rgba(0,0,0,0.12)",
};

const donut3dHole = {
  position: "absolute",
  inset: 58,
  background: "#fff",
  borderRadius: "50%",
  border: `1px solid ${theme.divider}`,
  boxShadow:
    "inset 0 8px 16px rgba(0,0,0,0.06), 0 2px 5px rgba(255,255,255,0.9)",
};

const donutLegendLeft = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const breakdownItem = {
  background: "#fff",
  border: "1px solid #E5D9CB",
  borderRadius: 14,
  padding: 12,
  display: "grid",
  gridTemplateColumns: "14px 1fr auto",
  gap: 10,
  alignItems: "center",
};

const breakdownDot = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  display: "inline-block",
};

const breakdownName = {
  fontWeight: 700,
  color: theme.navy,
  fontSize: 14,
  textAlign: "right",
};

const breakdownSub = {
  fontSize: 12,
  color: theme.textSoft,
  marginTop: 2,
  textAlign: "right",
};

const breakdownPercent = {
  fontWeight: 700,
  color: theme.navy,
  fontSize: 14,
  minWidth: 64,
  textAlign: "left",
};

const equityValueWrap = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const equityValue = {
  fontSize: 34,
  lineHeight: 1.1,
  fontWeight: 700,
  color: theme.navy,
};

const equityLabel = {
  fontSize: 14,
  fontWeight: 700,
  color: theme.textSoft,
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

const summaryStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const statCard = {
  background: theme.surfaceAlt,
  border: `1px solid ${theme.divider}`,
  borderRadius: 14,
  padding: 14,
};

const statLabel = {
  fontSize: 12,
  color: theme.textSoft,
  marginBottom: 8,
};

const statValue = {
  fontSize: 18,
  fontWeight: 700,
  color: theme.navy,
};

const simpleInfoBox = {
  background: theme.surfaceAlt,
  border: `1px solid ${theme.divider}`,
  borderRadius: 14,
  padding: 16,
  marginTop: 12,
};

const infoLabel = {
  fontSize: 12,
  color: theme.textSoft,
  marginBottom: 8,
};

const infoValue = {
  fontSize: 16,
  fontWeight: 700,
  color: theme.navy,
  lineHeight: 1.5,
};

const membersGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  alignItems: "start",
};

const memberCard = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 20,
  padding: 18,
  boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
};

const memberTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const memberName = {
  fontSize: 18,
  fontWeight: 700,
  color: theme.navy,
  marginBottom: 4,
};

const chip = {
  display: "inline-block",
  padding: "8px 12px",
  border: `1px solid ${theme.divider}`,
  borderRadius: 999,
  background: theme.surfaceAlt,
  fontSize: 12,
  color: "#486581",
  fontWeight: 700,
};

const centerCard = {
  background: theme.surfaceAlt,
  border: `1px solid ${theme.divider}`,
  borderRadius: 16,
  padding: 18,
  textAlign: "center",
  marginBottom: 12,
};

const centerLabel = {
  fontSize: 12,
  color: theme.textSoft,
  marginBottom: 8,
};

const centerValue = {
  fontSize: 24,
  fontWeight: 700,
  color: theme.navy,
  lineHeight: 1.15,
};

const miniGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 12,
};

const compareMiniCard = {
  background: theme.surfaceAlt,
  border: `1px solid ${theme.divider}`,
  borderRadius: 16,
  padding: 14,
};

const compareMiniTitle = {
  fontSize: 12,
  color: theme.textSoft,
  marginBottom: 10,
  fontWeight: 700,
};

const compareMiniInner = {
  display: "grid",
  gridTemplateColumns: "1fr 1px 1fr",
  gap: 10,
  alignItems: "stretch",
};

const dividerLine = {
  background: theme.divider,
  width: 1,
};

const compareMiniSide = {
  textAlign: "center",
};

const compareMiniSideLabel = {
  fontSize: 11,
  color: theme.textSoft,
  marginBottom: 6,
};

const compareMiniSideValue = {
  fontSize: 16,
  fontWeight: 700,
  color: theme.navy,
  lineHeight: 1.2,
};

const insuranceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const insuranceCard = {
  background: theme.surfaceAlt,
  border: `1px solid ${theme.divider}`,
  borderRadius: 14,
  padding: 12,
};

const insuranceLabel = {
  fontSize: 12,
  color: theme.textSoft,
  marginBottom: 6,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const insuranceValue = {
  fontSize: 16,
  fontWeight: 700,
  color: theme.navy,
  lineHeight: 1.2,
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

export default ClientFamilyView;
