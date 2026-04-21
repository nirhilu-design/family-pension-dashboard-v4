import React, { useMemo, useState } from "react";

export default function ClientPortalPage() {
  const reportData = useMemo(() => {
    try {
      const raw = localStorage.getItem("clientReportData");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Failed to read client report data:", error);
      return null;
    }
  }, []);

  const [selectedView, setSelectedView] = useState("family");

  const formatCurrency = (value) =>
    `₪${Number(value || 0).toLocaleString("en-US")}`;

  const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

  if (!reportData || !reportData.family) {
    return (
      <div style={styles.emptyPage}>
        <div style={styles.emptyCard}>
          <h1 style={styles.emptyTitle}>אין נתונים להצגה</h1>
          <p style={styles.emptyText}>
            לא נמצא snapshot של הדוח ב־localStorage.
          </p>
          <button
            style={styles.primaryButton}
            onClick={() => {
              window.location.href = "/";
            }}
          >
            חזרה למערכת
          </button>
        </div>
      </div>
    );
  }

  const {
    family = {},
    members = [],
    products = [],
    managers = [],
    weightedForeignExposure = 0,
    weightedEquityExposure = 0,
  } = reportData;

  const selectedMember =
    selectedView === "family"
      ? null
      : members.find((member, index) => `${index}` === selectedView) || null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.hero}>
          <div style={styles.heroTop}>
            <div>
              <div style={styles.eyebrow}>פורטל לקוח</div>
              <h1 style={styles.title}>דוח פנסיוני משפחתי</h1>
              <p style={styles.subtitle}>
                תצוגת WEB מאוחדת למשפחה, עם אפשרות לעבור בין הסיכום המשפחתי לבין
                פירוט אישי לכל לקוח.
              </p>
            </div>

            <div style={styles.heroActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => window.print()}
              >
                הדפס / PDF
              </button>

              <button
                style={styles.primaryButton}
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                חזרה למערכת
              </button>
            </div>
          </div>

          <div style={styles.heroMetaRow}>
            <div style={styles.heroMetaCard}>
              <div style={styles.heroMetaLabel}>תאריך עדכון</div>
              <div style={styles.heroMetaValue}>{family.lastUpdated || "—"}</div>
            </div>

            <div style={styles.heroMetaCard}>
              <div style={styles.heroMetaLabel}>בני משפחה</div>
              <div style={styles.heroMetaValue}>{members.length}</div>
            </div>

            <div style={styles.heroMetaCard}>
              <div style={styles.heroMetaLabel}>מוצרים</div>
              <div style={styles.heroMetaValue}>{products.length}</div>
            </div>

            <div style={styles.heroMetaCard}>
              <div style={styles.heroMetaLabel}>גופים מנהלים</div>
              <div style={styles.heroMetaValue}>{managers.length}</div>
            </div>
          </div>
        </header>

        <section style={styles.tabsCard}>
          <div style={styles.tabsWrap}>
            <button
              style={{
                ...styles.tabButton,
                ...(selectedView === "family" ? styles.tabButtonActive : {}),
              }}
              onClick={() => setSelectedView("family")}
            >
              סיכום משפחתי
            </button>

            {members.map((member, index) => (
              <button
                key={`${member.name}-${index}`}
                style={{
                  ...styles.tabButton,
                  ...(selectedView === `${index}` ? styles.tabButtonActive : {}),
                }}
                onClick={() => setSelectedView(`${index}`)}
              >
                {member.name || `לקוח ${index + 1}`}
              </button>
            ))}
          </div>
        </section>

        {selectedView === "family" ? (
          <>
            <section style={styles.kpiGrid}>
              <KpiCard
                title="סך נכסים משפחתי"
                value={formatCurrency(family.totalAssets)}
                subtext="סך הצבירה של כלל בני המשפחה"
              />
              <KpiCard
                title="הפקדה חודשית"
                value={formatCurrency(family.monthlyDeposits)}
                subtext="סך ההפקדות החודשיות בתיק"
              />
              <KpiCard
                title="קצבה חודשית צפויה"
                value={formatCurrency(family.monthlyPensionWithDeposits)}
                subtext="עם המשך הפקדות"
              />
              <KpiCard
                title="צבירה צפויה בגיל פרישה"
                value={formatCurrency(family.projectedLumpSumWithDeposits)}
                subtext="עם המשך הפקדות"
              />
            </section>

            <section style={styles.twoColGrid}>
              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>מדדי חשיפה</h2>
                <div style={styles.metricList}>
                  <MetricRow
                    label='חשיפה לחו"ל'
                    value={formatPercent(weightedForeignExposure)}
                  />
                  <MetricRow
                    label="חשיפה מנייתית משוקללת"
                    value={formatPercent(weightedEquityExposure)}
                  />
                </div>
              </div>

              <div style={styles.sectionCard}>
                <h2 style={styles.sectionTitle}>סיכום תיק</h2>
                <div style={styles.metricList}>
                  <MetricRow label="מספר בני משפחה" value={members.length} />
                  <MetricRow label="מספר מוצרים" value={products.length} />
                  <MetricRow label="מספר גופים מנהלים" value={managers.length} />
                </div>
              </div>
            </section>

            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>פירוט בני המשפחה</h2>
                <div style={styles.sectionSubtitle}>
                  מעבר מהיר בין לקוחות והצגת נתונים מרכזיים לכל אחד
                </div>
              </div>

              <div style={styles.memberGrid}>
                {members.length ? (
                  members.map((member, index) => (
                    <div key={`${member.name}-${index}`} style={styles.memberCard}>
                      <div style={styles.memberName}>
                        {member.name || `לקוח ${index + 1}`}
                      </div>

                      <div style={styles.memberMetric}>
                        <span>סך צבירה</span>
                        <strong>{formatCurrency(member.assets)}</strong>
                      </div>

                      <div style={styles.memberMetric}>
                        <span>הפקדה חודשית</span>
                        <strong>{formatCurrency(member.monthlyDeposits)}</strong>
                      </div>

                      <div style={styles.memberMetric}>
                        <span>קצבה חודשית צפויה</span>
                        <strong>
                          {formatCurrency(member.monthlyPensionWithDeposits)}
                        </strong>
                      </div>

                      <div style={styles.memberMetric}>
                        <span>סכום חד הוני</span>
                        <strong>{formatCurrency(member.lumpSumWithDeposits)}</strong>
                      </div>

                      <button
                        style={styles.primaryButton}
                        onClick={() => setSelectedView(`${index}`)}
                      >
                        לצפייה בפרטי הלקוח
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyInline}>לא נמצאו בני משפחה להצגה.</div>
                )}
              </div>
            </section>
          </>
        ) : (
          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  {selectedMember?.name || "לקוח"}
                </h2>
                <div style={styles.sectionSubtitle}>
                  תצוגה אישית במבנה דומה לדוח הראשי
                </div>
              </div>
            </div>

            {selectedMember ? (
              <>
                <section style={styles.kpiGrid}>
                  <KpiCard
                    title="סך צבירה"
                    value={formatCurrency(selectedMember.assets)}
                    subtext="היקף הנכסים של הלקוח"
                  />
                  <KpiCard
                    title="הפקדה חודשית"
                    value={formatCurrency(selectedMember.monthlyDeposits)}
                    subtext="הפקדות שוטפות"
                  />
                  <KpiCard
                    title="קצבה עם הפקדות"
                    value={formatCurrency(
                      selectedMember.monthlyPensionWithDeposits
                    )}
                    subtext="תחזית קצבה חודשית"
                  />
                  <KpiCard
                    title="קצבה ללא הפקדות"
                    value={formatCurrency(
                      selectedMember.monthlyPensionWithoutDeposits
                    )}
                    subtext="ללא המשך הפקדות"
                  />
                </section>

                <section style={styles.twoColGrid}>
                  <div style={styles.sectionSubCard}>
                    <h3 style={styles.subTitle}>תחזית פרישה</h3>
                    <div style={styles.metricList}>
                      <MetricRow
                        label="סכום חד הוני עם הפקדות"
                        value={formatCurrency(selectedMember.lumpSumWithDeposits)}
                      />
                      <MetricRow
                        label="סכום חד הוני ללא הפקדות"
                        value={formatCurrency(
                          selectedMember.lumpSumWithoutDeposits
                        )}
                      />
                    </div>
                  </div>

                  <div style={styles.sectionSubCard}>
                    <h3 style={styles.subTitle}>כיסויים ביטוחיים</h3>
                    <div style={styles.metricList}>
                      <MetricRow
                        label="ביטוח חיים"
                        value={formatCurrency(selectedMember.deathCoverage)}
                      />
                      <MetricRow
                        label="אובדן כושר עבודה"
                        value={`${formatCurrency(
                          selectedMember.disabilityValue
                        )} (${selectedMember.disabilityPercent || 0}%)`}
                      />
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div style={styles.emptyInline}>לא נמצא לקוח להצגה.</div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtext }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
      <div style={styles.kpiSub}>{subtext}</div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={styles.metricRow}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F6F4EF",
    direction: "rtl",
    fontFamily: 'Calibri, Arial, sans-serif',
    color: "#102A43",
    padding: "24px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  hero: {
    background: "linear-gradient(135deg, #0D347A, #00215D)",
    color: "#fff",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 8px 28px rgba(0,33,93,0.12)",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "12px",
    opacity: 0.8,
    marginBottom: "8px",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: "32px",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "12px 0 0",
    maxWidth: "760px",
    fontSize: "14px",
    lineHeight: 1.8,
    opacity: 0.92,
  },
  heroActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  heroMetaRow: {
    marginTop: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  },
  heroMetaCard: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "16px",
    padding: "14px",
  },
  heroMetaLabel: {
    fontSize: "12px",
    opacity: 0.75,
    marginBottom: "8px",
  },
  heroMetaValue: {
    fontSize: "20px",
    fontWeight: 700,
  },
  tabsCard: {
    background: "#fff",
    border: "1px solid #DCCDBA",
    borderRadius: "18px",
    padding: "14px",
    boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
  },
  tabsWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  tabButton: {
    border: "1px solid #D7DEEA",
    background: "#fff",
    color: "#102A43",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  tabButtonActive: {
    background: "#4F66E8",
    borderColor: "#4F66E8",
    color: "#fff",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
  },
  kpiCard: {
    background: "#fff",
    border: "1px solid #DCCDBA",
    borderRadius: "18px",
    padding: "20px",
    minHeight: "150px",
    boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  kpiTitle: {
    fontSize: "14px",
    color: "#627D98",
    fontWeight: 700,
    marginBottom: "10px",
  },
  kpiValue: {
    fontSize: "30px",
    fontWeight: 700,
    color: "#00215D",
    lineHeight: 1.15,
    marginBottom: "10px",
  },
  kpiSub: {
    fontSize: "12px",
    color: "#7A8CA8",
    lineHeight: 1.7,
  },
  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  sectionCard: {
    background: "#fff",
    border: "1px solid #DCCDBA",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
  },
  sectionSubCard: {
    background: "#FCFBF8",
    border: "1px solid #EEE4D8",
    borderRadius: "16px",
    padding: "18px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#00215D",
    fontWeight: 700,
  },
  sectionSubtitle: {
    fontSize: "13px",
    color: "#627D98",
    lineHeight: 1.7,
  },
  subTitle: {
    margin: "0 0 12px",
    fontSize: "16px",
    color: "#00215D",
  },
  metricList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    padding: "14px 16px",
    background: "#FCFBF8",
    border: "1px solid #EEE4D8",
    borderRadius: "14px",
  },
  metricLabel: {
    color: "#627D98",
    fontSize: "13px",
  },
  metricValue: {
    color: "#00215D",
    fontSize: "16px",
  },
  memberGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  memberCard: {
    background: "#FCFBF8",
    border: "1px solid #EEE4D8",
    borderRadius: "18px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  memberName: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#00215D",
    marginBottom: "4px",
  },
  memberMetric: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#102A43",
    paddingBottom: "10px",
    borderBottom: "1px solid #EEE4D8",
  },
  primaryButton: {
    border: "1px solid #4F66E8",
    background: "#4F66E8",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
  },
  emptyPage: {
    minHeight: "100vh",
    background: "#F6F4EF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    direction: "rtl",
    fontFamily: 'Calibri, Arial, sans-serif',
  },
  emptyCard: {
    background: "#fff",
    border: "1px solid #DCCDBA",
    borderRadius: "20px",
    padding: "28px",
    maxWidth: "520px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
  },
  emptyTitle: {
    margin: "0 0 12px",
    color: "#00215D",
  },
  emptyText: {
    margin: "0 0 18px",
    color: "#627D98",
    lineHeight: 1.8,
  },
  emptyInline: {
    background: "#FCFBF8",
    border: "1px dashed #DCCDBA",
    borderRadius: "14px",
    padding: "18px",
    color: "#627D98",
  },
};
