function ClientFamilyView({ clientModel }) {
  const summary = clientModel.summary || {};
  const exposures = clientModel.exposures || {};
  const members = clientModel.members || [];
  const managers = clientModel.distributions?.managers || [];
  const products = clientModel.distributions?.products || [];
  const mainGroups =
    clientModel.distributions?.mainGroups ||
    clientModel.distributions?.mainGroupAllocation ||
    clientModel.mainGroupAllocation ||
    clientModel.distributions?.assetClasses ||
    [];

  const loans = clientModel.loans || {};
  const loanDetails = Array.isArray(loans.details) ? loans.details : [];

  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  const totalLoansAmount = loanDetails.reduce(
    (sum, loan) => sum + Number(loan.amount || loan.balance || 0),
    0
  );

  const loanRatioToAssets =
    Number(summary.totalAssets || 0) > 0
      ? (totalLoansAmount / Number(summary.totalAssets || 0)) * 100
      : 0;

  const lumpBars = buildCompareBars(
    summary.projectedLumpSumWithDeposits,
    summary.projectedLumpSumWithoutDeposits,
    formatCurrency
  );

  const pensionBars = buildCompareBars(
    summary.monthlyPensionWithDeposits,
    summary.monthlyPensionWithoutDeposits,
    formatCurrency
  );

  return (
    <div style={page}>
      <Header
        title="דוח פנסיוני משפחתי מאוחד"
        eyebrow="מסך לקוח · דוח משפחתי מאוחד"
        subtitle="ריכזנו עבורך תמונת מצב משפחתית אחת הכוללת את כלל הנכסים הפנסיוניים, תחזית פרישה, פיזור בין מוצרים וגופים מנהלים, חשיפות ומידע מרכזי לכל אחד מבני המשפחה."
        lastUpdated={clientModel.lastUpdated}
      />

      <section style={topGrid}>
        <DonutSummaryCard
          title="חלוקה לפי גופים מנהלים"
          subtitle="התפלגות הניהול בין החברות והגופים המנהלים."
          items={managers}
          formatCurrency={formatCurrency}
        />

        <DonutSummaryCard
          title="חלוקה לפי מוצרים"
          subtitle="התפלגות הנכסים בין סוגי החיסכון הקיימים בתיק."
          items={products}
          formatCurrency={formatCurrency}
        />

        <KpiCard
          icon={<DepositIcon />}
          title="הפקדה חודשית"
          value={formatCurrency(summary.monthlyDeposits)}
          subtext="סך ההפקדות החודשיות של בני המשפחה"
        />

        <KpiCard
          icon={<GiftIcon />}
          title="סך נכסים"
          value={formatCurrency(summary.totalAssets)}
          subtext="סך הצבירה הכולל של התא המשפחתי"
        />
      </section>

      <section style={compareGrid}>
        <ComparisonChartCard
          title="קצבה חודשית בגיל פרישה"
          explanation="השוואה בין קצבה צפויה עם המשך הפקדות לבין ללא המשך הפקדות."
          bars={pensionBars}
        />

        <ComparisonChartCard
          title="צבירה צפויה בגיל פרישה"
          explanation="השוואה בין סכום חד פעמי צפוי עם המשך הפקדות לבין ללא המשך הפקדות."
          bars={lumpBars}
        />
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

      <SectionCard title="חלוקה לפי אפיקים ראשיים" icon="🥧">
        <div style={explanation}>
          התרשים מציג חלוקה משוקללת לפי צבירה של הקטגוריות הראשיות בכלל המוצרים.
        </div>

        <FullWidthDonutCard
          items={mainGroups.length ? mainGroups : products}
          formatCurrency={formatCurrency}
          emptyText="אין נתוני אפיקים להצגה"
        />
      </SectionCard>

      <SectionCard title="פירוט לפי בני משפחה" icon="👨‍👩‍👧‍👦">
        <div style={explanation}>
          מוצגת תמונת מצב אישית לכל אחד מבני המשפחה, כולל צבירה, הפקדה, קצבה
          צפויה, סכום חד הוני וכיסויים ביטוחיים.
        </div>

        {members.length ? (
          <div style={membersGrid}>
            {members.map((member) => (
              <MemberCard
                key={member.id || member.name}
                member={member}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        ) : (
          <EmptyText>אין בני משפחה להצגה</EmptyText>
        )}
      </SectionCard>

      <SectionCard title="הלוואות על חשבון מוצרים פנסיוניים" icon="💳">
        <div style={explanation}>פירוט הלוואות לפי אדם עם סיכום כולל ויחס לנכסים.</div>

        {loanDetails.length ? (
          <>
            <div style={summaryStatsGrid}>
              <SmallStat title="סה״כ הלוואות" value={formatCurrency(totalLoansAmount)} />
              <SmallStat title="יחס לנכסים" value={`${loanRatioToAssets.toFixed(1)}%`} />
            </div>

            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>שם</th>
                    <th style={th}>סכום הלוואה</th>
                    <th style={th}>יתרה</th>
                    <th style={th}>תדירות החזר</th>
                    <th style={th}>תאריך סיום</th>
                  </tr>
                </thead>
                <tbody>
                  {loanDetails.map((loan, index) => (
                    <tr key={loan.id || index}>
                      <td style={td}>
                        {[loan.firstName, loan.familyName].filter(Boolean).join(" ") ||
                          loan.name ||
                          "—"}
                      </td>
                      <td style={td}>{formatCurrency(loan.amount)}</td>
                      <td style={td}>{formatCurrency(loan.balance)}</td>
                      <td style={td}>{loan.repaymentFrequency || "—"}</td>
                      <td style={td}>{formatDate(loan.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyText>לא התקבל מידע על הלוואות להצגה.</EmptyText>
        )}
      </SectionCard>

      <SectionCard title="סיכום מהיר" icon="🧾">
        <div style={summaryStatsGrid}>
          <SmallStat title="מוצרים" value={products.length} />
          <SmallStat title="גופים מנהלים" value={managers.length} />
          <SmallStat title="בני משפחה" value={members.length} />
          <SmallStat title="חשיפה מנייתית" value={formatPercent(exposures.equity)} />
        </div>

        <InfoBox
          label="קצבה חודשית צפויה"
          value={formatCurrency(summary.monthlyPensionWithDeposits)}
        />

        <InfoBox
          label="צבירה צפויה בגיל פרישה"
          value={formatCurrency(summary.projectedLumpSumWithDeposits)}
        />

        <InfoBox label="יחס הלוואות לנכסים" value={`${loanRatioToAssets.toFixed(1)}%`} />
      </SectionCard>
    </div>
  );
}

function buildCompareBars(withDeposits, withoutDeposits, formatCurrency) {
  const withValue = Number(withDeposits || 0);
  const withoutValue = Number(withoutDeposits || 0);
  const maxValue = Math.max(withValue, withoutValue, 1);

  return [
    {
      label: "עם הפקדות",
      value: withValue,
      display: formatCurrency(withValue),
      ratio: (withValue / maxValue) * 100,
      tone: "primary",
    },
    {
      label: "ללא הפקדות",
      value: withoutValue,
      display: formatCurrency(withoutValue),
      ratio: (withoutValue / maxValue) * 100,
      tone: "muted",
    },
  ];
}

function Header({ eyebrow, title, subtitle, lastUpdated }) {
  return (
    <section style={heroHeader}>
      <div style={heroLogoWrap}>
        <ZviranLogo light />
      </div>

      <div style={heroCenter}>
        <div style={heroEyebrow}>{eyebrow}</div>
        <h1 style={heroTitle}>{title}</h1>
        <div style={heroSubtitle}>{subtitle}</div>
      </div>

      <div style={heroMeta}>
        <div style={heroMetaLabel}>תאריך עדכון</div>
        <div style={heroMetaValue}>
          {lastUpdated || new Intl.DateTimeFormat("he-IL").format(new Date())}
        </div>
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

function ComparisonChartCard({ title, explanation, bars }) {
  return (
    <section style={compareCard}>
      <div style={compareTitle}>{title}</div>
      <div style={compareDesc}>{explanation}</div>

      <div style={compareBarList}>
        {bars.map((bar) => (
          <div key={bar.label} style={compareBarItem}>
            <div style={compareBarTop}>
              <div style={compareBarLabel}>{bar.label}</div>
              <div style={compareBarValue}>{bar.display}</div>
            </div>

            <div style={compareTrack}>
              <div
                style={{
                  ...(bar.tone === "primary" ? compareFillPrimary : compareFillMuted),
                  width: `${Math.max(bar.ratio, 6)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutSummaryCard({ title, subtitle, items, formatCurrency }) {
  const data = buildSegments(items);

  return (
    <section style={donutCard}>
      <h3 style={donutTitle}>{title}</h3>
      <div style={{ ...smallText, marginTop: 6 }}>{subtitle}</div>

      {!data.segments.length ? (
        <EmptyText>אין נתונים להצגה</EmptyText>
      ) : (
        <div style={donutLayout}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                ...smallDonut,
                background: `conic-gradient(${data.gradient})`,
              }}
            >
              <div style={smallDonutHole} />
            </div>
          </div>

          <div style={legendList}>
            {data.segments.slice(0, 5).map((seg, index) => (
              <LegendRow
                key={`${seg.id || seg.name}-${index}`}
                seg={seg}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function FullWidthDonutCard({ items, formatCurrency, emptyText }) {
  const data = buildSegments(items);

  if (!data.segments.length) {
    return <EmptyText>{emptyText}</EmptyText>;
  }

  return (
    <div style={fullDonutLayout}>
      <div style={donutRight}>
        <div style={donut3dShadow}>
          <div
            style={{
              ...donut3d,
              background: `conic-gradient(${data.gradient})`,
            }}
          >
            <div style={donut3dHole} />
          </div>
        </div>
      </div>

      <div style={donutLegendLeft}>
        {data.segments.map((seg, index) => (
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

function LegendRow({ seg, formatCurrency }) {
  return (
    <div style={legendRow}>
      <span style={{ ...legendDot, background: seg.color }} />
      <div style={{ minWidth: 0 }}>
        <div style={legendName}>{seg.name}</div>
        <div style={legendSub}>{formatCurrency(seg.value)}</div>
      </div>
      <div style={legendPercent}>{seg.percent.toFixed(1)}%</div>
    </div>
  );
}

function MemberCard({ member, formatCurrency }) {
  const summary = member.summary || {};
  const insurance = member.insurance || {};

  return (
    <div style={memberCard}>
      <div style={memberTop}>
        <div>
          <div style={memberName}>{member.name}</div>
        </div>

        <div style={chip}>
          הפקדה חודשית: {formatCurrency(summary.monthlyDeposits)}
        </div>
      </div>

      <div style={centerCard}>
        <div style={centerLabel}>סך צבירה</div>
        <div style={centerValue}>{formatCurrency(summary.totalAssets)}</div>
      </div>

      <div style={miniGrid}>
        <CompareMiniCard
          title="קצבה חודשית צפויה"
          leftLabel="עם הפקדות"
          leftValue={formatCurrency(summary.monthlyPensionWithDeposits)}
          rightLabel="ללא הפקדות"
          rightValue={formatCurrency(summary.monthlyPensionWithoutDeposits)}
        />

        <CompareMiniCard
          title="סכום חד הוני לפרישה"
          leftLabel="עם הפקדות"
          leftValue={formatCurrency(summary.projectedLumpSumWithDeposits)}
          rightLabel="ללא הפקדות"
          rightValue={formatCurrency(summary.projectedLumpSumWithoutDeposits)}
        />
      </div>

      <div style={insuranceGrid}>
        <div style={insuranceCard}>
          <div style={insuranceLabel}>🛡️ ביטוח חיים</div>
          <div style={insuranceValue}>{formatCurrency(insurance.deathCoverage)}</div>
        </div>

        <div style={insuranceCard}>
          <div style={insuranceLabel}>🧍 אובדן כושר עבודה</div>
          <div style={insuranceValue}>
            {formatCurrency(insurance.disabilityValue)} (
            {Number(insurance.disabilityPercent || 0).toFixed(1)}%)
          </div>
        </div>
      </div>
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

function ZviranLogo({ light = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        direction: "ltr",
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: light ? "rgba(255,255,255,0.14)" : "#0A2668",
          border: light ? "1px solid rgba(255,255,255,0.25)" : "none",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 24,
            height: 8,
            background: "#FF2756",
            borderRadius: 999,
            top: 15,
            left: 16,
            transform: "rotate(-35deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 24,
            height: 8,
            background: "#ffffff",
            borderRadius: 999,
            top: 24,
            left: 12,
            transform: "rotate(-35deg)",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 300,
            letterSpacing: "-1px",
            color: light ? "#fff" : "#0A2668",
          }}
        >
          zviran
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: light ? "rgba(255,255,255,0.8)" : "#6B7A99",
            letterSpacing: "0.4px",
          }}
        >
          Total Rewards Experts
        </div>
      </div>
    </div>
  );
}

function GiftIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="7" width="16" height="13" rx="2" stroke="#00215D" strokeWidth="2" />
      <path d="M12 7V20" stroke="#00215D" strokeWidth="2" />
      <path d="M4 11H20" stroke="#00215D" strokeWidth="2" />
      <path d="M9 7C7.8 7 7 6.2 7 5C7 3.8 7.8 3 9 3C10.8 3 12 5 12 7" stroke="#00215D" strokeWidth="2" />
      <path d="M15 7C16.2 7 17 6.2 17 5C17 3.8 16.2 3 15 3C13.2 3 12 5 12 7" stroke="#00215D" strokeWidth="2" />
    </svg>
  );
}

function DepositIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <path d="M12 3V14" stroke="#FF2756" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.5 6.5L12 3L15.5 6.5" stroke="#FF2756" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="14" width="16" height="6" rx="2" stroke="#FF2756" strokeWidth="2.2" />
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
  mutedBar: "#C7D1E2",
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
  display: "grid",
  gridTemplateColumns: "1fr 2fr 1fr",
  alignItems: "center",
  gap: 16,
  direction: "ltr",
};

const heroLogoWrap = {
  justifySelf: "start",
  direction: "ltr",
};

const heroCenter = {
  textAlign: "center",
  direction: "rtl",
};

const heroMeta = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  alignItems: "flex-end",
  justifySelf: "end",
  direction: "rtl",
};

const heroMetaLabel = {
  fontSize: 12,
  color: "rgba(255,255,255,0.75)",
};

const heroMetaValue = {
  fontSize: 14,
  fontWeight: 700,
  color: "#fff",
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

const compareGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
  marginBottom: 18,
};

const lowerTwoGrid = {
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

const donutCard = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 20,
  padding: 18,
  minHeight: 188,
  boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
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
  gridTemplateColumns: "110px 1fr",
  gap: 14,
  alignItems: "center",
  marginTop: 12,
};

const smallDonut = {
  width: 96,
  height: 96,
  borderRadius: "50%",
  position: "relative",
  flexShrink: 0,
};

const smallDonutHole = {
  position: "absolute",
  inset: 15,
  background: "#fff",
  borderRadius: "50%",
  border: "1px solid #E5D9CB",
};

const legendList = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const legendRow = {
  display: "grid",
  gridTemplateColumns: "10px 1fr auto",
  gap: 8,
  alignItems: "center",
  fontSize: 12,
};

const legendDot = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  display: "inline-block",
};

const legendName = {
  color: theme.text,
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const legendSub = {
  color: theme.textSoft,
  fontSize: 11,
  marginTop: 2,
};

const legendPercent = {
  color: theme.text,
  fontWeight: 700,
};

const compareCard = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 20,
  padding: 20,
  minHeight: 210,
  boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
};

const compareTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: theme.navy,
  marginBottom: 8,
};

const compareDesc = {
  fontSize: 12,
  color: theme.textSoft,
  lineHeight: 1.7,
  marginBottom: 18,
};

const compareBarList = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const compareBarItem = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const compareBarTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const compareBarLabel = {
  fontSize: 12,
  color: "#4A5D7A",
  fontWeight: 700,
};

const compareBarValue = {
  fontSize: 18,
  color: theme.navy,
  fontWeight: 700,
};

const compareTrack = {
  width: "100%",
  height: 18,
  borderRadius: 999,
  background: theme.softBlue,
  overflow: "hidden",
};

const compareFillPrimary = {
  height: "100%",
  borderRadius: 999,
  background: `linear-gradient(90deg, ${theme.accent}, ${theme.navy})`,
};

const compareFillMuted = {
  height: "100%",
  borderRadius: 999,
  background: theme.mutedBar,
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
};

const barScale = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: 10,
  fontSize: 12,
  color: theme.textSoft,
  direction: "ltr",
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
};

const insuranceValue = {
  fontSize: 16,
  fontWeight: 700,
  color: theme.navy,
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
  minWidth: 760,
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
};

export default ClientFamilyView;
