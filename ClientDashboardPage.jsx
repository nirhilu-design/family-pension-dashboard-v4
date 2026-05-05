import React, { useMemo } from "react";

const STORAGE_CLIENT_MODEL_KEY = "familyPensionClientModel";
const STORAGE_REPORT_DATA_KEY = "familyPensionReportData";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readJsonFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage`, error);
    return null;
  }
}

function writeJsonToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write ${key} to localStorage`, error);
    return false;
  }
}

function normalizeDistributionItems(items) {
  return safeArray(items)
    .map((item, index) => ({
      id: item?.id || item?.name || `distribution-${index}`,
      name: item?.name || item?.label || item?.title || "ללא שם",
      value: Number(item?.value || item?.amount || item?.assets || 0),
      percent: Number(item?.percent || item?.percentage || 0),
    }))
    .filter((item) => item.value > 0 || item.percent > 0);
}

function normalizeLoanDetails(loans) {
  return safeArray(loans?.details).map((loan, index) => ({
    id:
      loan?.id ||
      `${loan?.firstName || ""}_${loan?.familyName || ""}_${
        loan?.endDate || ""
      }_${index}`,
    firstName: loan?.firstName || "",
    familyName: loan?.familyName || "",
    name:
      loan?.name ||
      [loan?.firstName, loan?.familyName].filter(Boolean).join(" ").trim() ||
      "",
    amount: Number(loan?.amount || 0),
    balance: Number(loan?.balance || 0),
    repaymentFrequency: loan?.repaymentFrequency || "",
    endDate: loan?.endDate || "",
  }));
}

function buildClientModelFromReportData(reportData) {
  const data = reportData || {};
  const family = data.family || {};

  const products = normalizeDistributionItems(data.products);
  const managers = normalizeDistributionItems(data.managers);
  const mainGroupAllocation = normalizeDistributionItems(data.mainGroupAllocation);

  return {
    lastUpdated:
      family.lastUpdated ||
      data.lastUpdated ||
      new Intl.DateTimeFormat("he-IL").format(new Date()),

    summary: {
      totalAssets: Number(family.totalAssets || 0),
      monthlyDeposits: Number(family.monthlyDeposits || 0),
      projectedLumpSumWithDeposits: Number(
        family.projectedLumpSumWithDeposits || 0
      ),
      projectedLumpSumWithoutDeposits: Number(
        family.projectedLumpSumWithoutDeposits || 0
      ),
      monthlyPensionWithDeposits: Number(
        family.monthlyPensionWithDeposits || 0
      ),
      monthlyPensionWithoutDeposits: Number(
        family.monthlyPensionWithoutDeposits || 0
      ),
    },

    exposures: {
      equity: Number(data.weightedEquityExposure || 0),
      foreign: Number(data.weightedForeignExposure || 0),
    },

    distributions: {
      products,
      managers,
      mainGroups: mainGroupAllocation,
      mainGroupAllocation,
      assetClasses: mainGroupAllocation,
      foreignExposureAllocation: normalizeDistributionItems(
        data.foreignExposureAllocation
      ),
    },

    members: safeArray(data.members).map((member, index) => ({
      id: member?.id || member?.name || `member-${index}`,
      name: member?.name || "ללא שם",

      summary: {
        totalAssets: Number(member?.assets || member?.totalAssets || 0),
        monthlyDeposits: Number(member?.monthlyDeposits || 0),
        monthlyPensionWithDeposits: Number(
          member?.monthlyPensionWithDeposits || 0
        ),
        monthlyPensionWithoutDeposits: Number(
          member?.monthlyPensionWithoutDeposits || 0
        ),
        projectedLumpSumWithDeposits: Number(
          member?.lumpSumWithDeposits ||
            member?.projectedLumpSumWithDeposits ||
            0
        ),
        projectedLumpSumWithoutDeposits: Number(
          member?.lumpSumWithoutDeposits ||
            member?.projectedLumpSumWithoutDeposits ||
            0
        ),
      },

      insurance: {
        deathCoverage: Number(member?.deathCoverage || 0),
        disabilityValue: Number(member?.disabilityValue || 0),
        disabilityPercent: Number(member?.disabilityPercent || 0),
      },
    })),

    loans: {
      hasData: Boolean(data.loans?.hasData),
      details: normalizeLoanDetails(data.loans),
    },

    sourceReportData: data,
  };
}

function hasUsableClientModel(clientModel) {
  if (!clientModel || typeof clientModel !== "object" || Array.isArray(clientModel)) {
    return false;
  }

  return Boolean(
    clientModel.summary ||
      clientModel.members ||
      clientModel.distributions ||
      clientModel.exposures ||
      clientModel.loans
  );
}

function getClientModelFromStorage() {
  const storedClientModel = readJsonFromStorage(STORAGE_CLIENT_MODEL_KEY);

  if (hasUsableClientModel(storedClientModel)) {
    return storedClientModel;
  }

  const storedReportData = readJsonFromStorage(STORAGE_REPORT_DATA_KEY);

  if (storedReportData) {
    const convertedClientModel = buildClientModelFromReportData(storedReportData);
    writeJsonToStorage(STORAGE_CLIENT_MODEL_KEY, convertedClientModel);
    return convertedClientModel;
  }

  return null;
}

function EmptyClientDashboardState() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/";
  };

  const handleClearStorage = () => {
    localStorage.removeItem(STORAGE_CLIENT_MODEL_KEY);
    localStorage.removeItem(STORAGE_REPORT_DATA_KEY);
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        direction: "rtl",
        fontFamily: 'Calibri, "Arial", sans-serif',
        background: "#F9F7F3",
        color: "#102A43",
        padding: 32,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          background: "#FFFFFF",
          border: "1px solid #E2D1BF",
          borderRadius: 22,
          padding: 32,
          boxShadow: "0 10px 28px rgba(16,42,67,0.08)",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 18px",
            borderRadius: "50%",
            background: "#EAF1FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#00215D",
            fontSize: 30,
            fontWeight: 900,
          }}
        >
          !
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            color: "#00215D",
            fontSize: 28,
            lineHeight: 1.25,
            fontWeight: 800,
          }}
        >
          אין נתוני דוח להצגה
        </h1>

        <p
          style={{
            margin: "0 auto 22px",
            maxWidth: 660,
            color: "#627D98",
            fontSize: 15,
            lineHeight: 1.8,
          }}
        >
          תצוגת הלקוח לא מצאה נתוני דוח שמורים בדפדפן. יש להפיק דוח במסך הראשי
          ואז ללחוץ על “פתח תצוגת לקוח”.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
            margin: "0 auto 22px",
            maxWidth: 620,
            textAlign: "right",
          }}
        >
          <div
            style={{
              background: "#FCFBF8",
              border: "1px solid #EEE4D8",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                color: "#00215D",
                fontWeight: 800,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              מה נבדק?
            </div>
            <div style={{ color: "#627D98", fontSize: 13, lineHeight: 1.7 }}>
              הקובץ חיפש ב־localStorage את familyPensionClientModel, ואם לא מצא
              ניסה לשחזר מתוך familyPensionReportData.
            </div>
          </div>

          <div
            style={{
              background: "#FCFBF8",
              border: "1px solid #EEE4D8",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                color: "#00215D",
                fontWeight: 800,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              מה לעשות?
            </div>
            <div style={{ color: "#627D98", fontSize: 13, lineHeight: 1.7 }}>
              החלף גם את ReportPage.jsx המתוקן, הפק דוח מחדש, ואז פתח שוב את
              תצוגת הלקוח.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              minWidth: 160,
              minHeight: 44,
              border: "1px solid #D9DDE8",
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#102A43",
              fontWeight: 800,
              fontFamily: 'Calibri, "Arial", sans-serif',
              cursor: "pointer",
            }}
          >
            חזרה
          </button>

          <button
            type="button"
            onClick={handleClearStorage}
            style={{
              minWidth: 160,
              minHeight: 44,
              border: "1px solid #FF2756",
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#FF2756",
              fontWeight: 800,
              fontFamily: 'Calibri, "Arial", sans-serif',
              cursor: "pointer",
            }}
          >
            נקה נתונים שמורים
          </button>
        </div>
      </div>
    </div>
  );
}


function getQueryParam(name) {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  } catch (error) {
    return null;
  }
}

function findMemberForClientView(clientModel, memberIdFromUrl) {
  const members = Array.isArray(clientModel?.members) ? clientModel.members : [];
  if (!members.length) return null;

  if (!memberIdFromUrl) return members[0];

  const decoded = decodeURIComponent(String(memberIdFromUrl));

  return (
    members.find(
      (member) =>
        String(member?.id || "") === decoded ||
        String(member?.name || "") === decoded
    ) || members[0]
  );
}

function ClientMemberView({ clientModel, member }) {
  const summary = member?.summary || {};
  const insurance = member?.insurance || {};
  const familySummary = clientModel?.summary || {};

  const formatCurrency = (value) =>
    `₪${Math.round(Number(value || 0)).toLocaleString("en-US")}`;

  const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

  const shareOfFamily =
    Number(familySummary.totalAssets || 0) > 0
      ? (Number(summary.totalAssets || 0) /
          Number(familySummary.totalAssets || 0)) *
        100
      : 0;

  const cardStyle = {
    background: "#FFFFFF",
    border: "1px solid #E2D1BF",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
    boxSizing: "border-box",
  };

  const statLabel = {
    color: "#627D98",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: 700,
  };

  const statValue = {
    color: "#00215D",
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1.15,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9F7F3",
        direction: "rtl",
        fontFamily: 'Calibri, "Arial", sans-serif',
        color: "#102A43",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 7mm;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              direction: rtl !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div
        className="no-print"
        style={{
          maxWidth: 1180,
          margin: "0 auto 16px",
          display: "flex",
          justifyContent: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            minWidth: 150,
            minHeight: 42,
            borderRadius: 12,
            border: "1px solid #00215D",
            background: "#00215D",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: 'Calibri, "Arial", sans-serif',
          }}
        >
          ייצוא ל־PDF
        </button>

        <button
          type="button"
          onClick={() => window.close()}
          style={{
            minWidth: 150,
            minHeight: 42,
            borderRadius: 12,
            border: "1px solid #D9DDE8",
            background: "#fff",
            color: "#102A43",
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: 'Calibri, "Arial", sans-serif',
          }}
        >
          סגירה
        </button>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #00215D, #001845)",
            color: "#fff",
            borderRadius: 24,
            padding: "28px 32px",
            marginBottom: 18,
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr",
            alignItems: "center",
            gap: 18,
            boxShadow: "0 8px 28px rgba(0,33,93,0.14)",
          }}
        >
          <div style={{ justifySelf: "start", direction: "ltr" }}>
            <ZviranLogo light />
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.78)",
                marginBottom: 8,
                fontWeight: 800,
              }}
            >
              מסך לקוח · דוח פרט
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 32,
                lineHeight: 1.2,
                color: "#fff",
                fontWeight: 900,
              }}
            >
              דוח פנסיוני אישי
            </h1>

            <div
              style={{
                marginTop: 10,
                color: "rgba(255,255,255,0.9)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {member?.name || "ללא שם"}
            </div>
          </div>

          <div style={{ justifySelf: "end", textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
              תאריך עדכון
            </div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>
              {clientModel?.lastUpdated ||
                new Intl.DateTimeFormat("he-IL").format(new Date())}
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div style={cardStyle}>
            <div style={statLabel}>סך צבירה</div>
            <div style={statValue}>{formatCurrency(summary.totalAssets)}</div>
          </div>

          <div style={cardStyle}>
            <div style={statLabel}>הפקדה חודשית</div>
            <div style={statValue}>{formatCurrency(summary.monthlyDeposits)}</div>
          </div>

          <div style={cardStyle}>
            <div style={statLabel}>חלק מהתיק המשפחתי</div>
            <div style={statValue}>{formatPercent(shareOfFamily)}</div>
          </div>

          <div style={cardStyle}>
            <div style={statLabel}>אובדן כושר עבודה</div>
            <div style={statValue}>
              {formatCurrency(insurance.disabilityValue)}
            </div>
            <div style={{ color: "#627D98", marginTop: 8, fontWeight: 700 }}>
              {formatPercent(insurance.disabilityPercent)}
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div style={cardStyle}>
            <h2
              style={{
                margin: "0 0 14px",
                color: "#00215D",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              קצבה חודשית צפויה
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 1fr",
                gap: 16,
                alignItems: "stretch",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={statLabel}>עם המשך הפקדות</div>
                <div style={statValue}>
                  {formatCurrency(summary.monthlyPensionWithDeposits)}
                </div>
              </div>

              <div style={{ background: "#EEE4D8" }} />

              <div style={{ textAlign: "center" }}>
                <div style={statLabel}>ללא המשך הפקדות</div>
                <div style={statValue}>
                  {formatCurrency(summary.monthlyPensionWithoutDeposits)}
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2
              style={{
                margin: "0 0 14px",
                color: "#00215D",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              סכום חד הוני לפרישה
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 1fr",
                gap: 16,
                alignItems: "stretch",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={statLabel}>עם המשך הפקדות</div>
                <div style={statValue}>
                  {formatCurrency(summary.projectedLumpSumWithDeposits)}
                </div>
              </div>

              <div style={{ background: "#EEE4D8" }} />

              <div style={{ textAlign: "center" }}>
                <div style={statLabel}>ללא המשך הפקדות</div>
                <div style={statValue}>
                  {formatCurrency(summary.projectedLumpSumWithoutDeposits)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2
            style={{
              margin: "0 0 14px",
              color: "#00215D",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            כיסויים ביטוחיים
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "#FCFBF8",
                border: "1px solid #EEE4D8",
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={statLabel}>הון למוטבים / פטירה</div>
              <div style={statValue}>{formatCurrency(insurance.deathCoverage)}</div>
            </div>

            <div
              style={{
                background: "#FCFBF8",
                border: "1px solid #EEE4D8",
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={statLabel}>אובדן כושר עבודה</div>
              <div style={statValue}>
                {formatCurrency(insurance.disabilityValue)}
              </div>
              <div style={{ color: "#627D98", marginTop: 8, fontWeight: 700 }}>
                שיעור כיסוי: {formatPercent(insurance.disabilityPercent)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  const clientModel = useMemo(() => getClientModelFromStorage(), []);
  const view = getQueryParam("view");
  const memberId = getQueryParam("memberId");

  if (!hasUsableClientModel(clientModel)) {
    return <EmptyClientDashboardState />;
  }

  if (view === "member") {
    const member = findMemberForClientView(clientModel, memberId);
    return <ClientMemberView clientModel={clientModel} member={member} />;
  }

  return <ClientFamilyView clientModel={clientModel} />;
}



function ClientFamilyView({ clientModel }) {
  const hasClientModel =
    clientModel && typeof clientModel === "object" && !Array.isArray(clientModel);

  if (!hasClientModel) {
    return (
      <div
        className="client-family-root"
        style={{
          direction: "rtl",
          fontFamily: 'Calibri, "Arial", sans-serif',
          minHeight: "100vh",
          padding: 32,
          background: "#F9F7F3",
          color: "#102A43",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "80px auto",
            background: "#FFFFFF",
            border: "1px solid #E2D1BF",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: "0 0 12px",
              color: "#00215D",
              fontSize: 26,
              lineHeight: 1.3,
            }}
          >
            אין נתוני דוח להצגה
          </h1>

          <p
            style={{
              margin: 0,
              color: "#627D98",
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            הדוח לא נוצר או שלא הועבר אובייקט clientModel למסך תצוגת הלקוח.
            בדוק שהכפתור “מעבר לתצוגת לקוח” מעביר את המודל שנבנה.
          </p>
        </div>
      </div>
    );
  }

  const summary = clientModel?.summary || {};
  const exposures = clientModel?.exposures || {};
  const members = Array.isArray(clientModel?.members) ? clientModel.members : [];
  const managers = Array.isArray(clientModel?.distributions?.managers)
    ? clientModel.distributions.managers
    : [];
  const products = Array.isArray(clientModel?.distributions?.products)
    ? clientModel.distributions.products
    : [];
  const mainGroupsCandidate =
    clientModel?.distributions?.mainGroups ||
    clientModel?.distributions?.mainGroupAllocation ||
    clientModel?.mainGroupAllocation ||
    clientModel?.distributions?.assetClasses ||
    [];

  const mainGroups = Array.isArray(mainGroupsCandidate) ? mainGroupsCandidate : [];

  const loans = clientModel?.loans || {};
  const loanDetails = Array.isArray(loans?.details) ? loans.details : [];

  const formatCurrency = (value) =>
    `₪${Math.round(Number(value || 0)).toLocaleString("en-US")}`;

  const formatPercent = (value) => `${Math.round(Number(value || 0))}%`;

  const totalLoansAmount = loanDetails.reduce(
    (sum, loan) => sum + Number(loan?.amount || loan?.balance || 0),
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
    <div className="client-family-root" style={page}>
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 6mm;
            }

            html,
            body {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              direction: rtl !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              zoom: 1 !important;
            }

            .client-family-root {
              width: 198mm !important;
              max-width: 198mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              direction: rtl !important;
              overflow: visible !important;
              box-sizing: border-box !important;
            }

            .client-family-root,
            .client-family-root * {
              box-sizing: border-box !important;
            }

            .family-print-page {
              width: 198mm !important;
              max-width: 198mm !important;
              min-height: auto !important;
              height: auto !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: visible !important;
              box-sizing: border-box !important;
            }

            .family-print-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            .family-hero {
              margin-bottom: 7px !important;
              padding: 9px 12px !important;
              border-radius: 13px !important;
              box-shadow: none !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .family-top-grid,
            .family-compare-grid,
            .family-lower-grid,
            .family-members-grid {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 7px !important;
              margin-bottom: 7px !important;
              align-items: stretch !important;
            }

            .family-summary-grid {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              gap: 7px !important;
              margin-bottom: 7px !important;
            }

            .family-section-card,
            .family-kpi-card,
            .family-donut-card,
            .family-compare-card,
            .family-member-card {
              width: auto !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border-radius: 12px !important;
              box-sizing: border-box !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              overflow: hidden !important;
            }

            .family-section-card {
              padding: 8px !important;
              margin-bottom: 7px !important;
            }

            .family-kpi-card {
              min-height: 78px !important;
              height: auto !important;
              padding: 7px !important;
            }

            .family-donut-card {
              min-height: 132px !important;
              height: auto !important;
              padding: 7px !important;
            }

            .family-compare-card {
              min-height: 112px !important;
              height: auto !important;
              padding: 7px !important;
            }

            .family-member-card {
              padding: 7px !important;
            }

            .family-donut-card [style*="grid-template-columns"] {
              grid-template-columns: 78px 1fr !important;
              gap: 6px !important;
              margin-top: 5px !important;
            }

            .family-donut-card [style*="width: 102px"],
            .family-donut-card [style*="width:102px"] {
              width: 76px !important;
              height: 76px !important;
            }

            .family-main-breakdown {
              display: grid !important;
              grid-template-columns: 165px minmax(0, 1fr) !important;
              gap: 8px !important;
              align-items: center !important;
              overflow: visible !important;
            }

            .family-main-donut {
              width: 165px !important;
              height: 165px !important;
              transform: none !important;
            }

            .family-main-legend-row {
              min-height: 21px !important;
              padding: 2px 0 !important;
              grid-template-columns: 9px minmax(0, 1fr) 72px 32px !important;
              gap: 5px !important;
            }

            table {
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            th,
            td {
              font-size: 8.5px !important;
              padding: 5px !important;
              white-space: normal !important;
            }

            h1 {
              font-size: 17px !important;
              line-height: 1.1 !important;
            }

            h2,
            h3 {
              font-size: 10px !important;
              line-height: 1.2 !important;
            }

            p,
            span,
            div {
              font-size: 8.5px !important;
            }

            .family-kpi-value {
              font-size: 18px !important;
              line-height: 1 !important;
              margin-bottom: 2px !important;
            }

            .family-center-value {
              font-size: 15px !important;
            }

            .family-explanation {
              margin-bottom: 5px !important;
              line-height: 1.3 !important;
            }

            .family-kpi-card svg {
              width: 18px !important;
              height: 18px !important;
            }

            .family-kpi-card > div:first-child {
              width: 32px !important;
              height: 32px !important;
              border-radius: 10px !important;
              margin-bottom: 3px !important;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="family-print-page family-print-page-1">
        <Header
          title="דוח פנסיוני משפחתי מאוחד"
          eyebrow="מסך לקוח · דוח משפחתי מאוחד"
          subtitle="ריכזנו עבורך תמונת מצב משפחתית אחת הכוללת את כלל הנכסים הפנסיוניים, תחזית פרישה, פיזור בין מוצרים וגופים מנהלים, חשיפות ומידע מרכזי לכל אחד מבני המשפחה."
          lastUpdated={clientModel.lastUpdated}
        />

        <section className="family-top-grid" style={topGrid}>
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

          <DonutSummaryCard
            title="חלוקה לפי מוצרים"
            subtitle="התפלגות הנכסים בין סוגי החיסכון הקיימים בתיק."
            items={products}
            formatCurrency={formatCurrency}
          />

          <DonutSummaryCard
            title="חלוקה לפי גופים מנהלים"
            subtitle="התפלגות הניהול בין החברות והגופים המנהלים."
            items={managers}
            formatCurrency={formatCurrency}
          />
        </section>

        <section className="family-compare-grid" style={compareGrid}>
          <ComparisonChartCard
            title="צבירה צפויה בגיל פרישה"
            explanation="השוואה בין סכום חד פעמי צפוי עם המשך הפקדות לבין ללא המשך הפקדות."
            bars={lumpBars}
          />

          <ComparisonChartCard
            title="קצבה חודשית בגיל פרישה"
            explanation="השוואה בין קצבה צפויה עם המשך הפקדות לבין ללא המשך הפקדות."
            bars={pensionBars}
          />
        </section>
      </div>

      <div className="family-print-page family-print-page-2">
        <section className="family-lower-grid" style={lowerTwoGrid}>
          <SectionCard title='חשיפה לחו"ל' icon="🌍">
            <ExposureMetricBlock
              value={exposures.foreign}
              valueText={formatPercent(exposures.foreign)}
              label={getForeignExposureLabel(exposures.foreign)}
              explanationText='התרשים מציג את החשיפה המשפחתית לחו"ל לפי הנתונים שעובדו מהקבצים.'
            />
          </SectionCard>

          <SectionCard title="חשיפה מנייתית משוקללת" icon="📊">
            <ExposureMetricBlock
              value={exposures.equity}
              valueText={formatPercent(exposures.equity)}
              label={getExposureLabel(exposures.equity)}
              explanationText="המדד מציג את רמת החשיפה למניות ברמת התא המשפחתי."
            />
          </SectionCard>
        </section>

        <SectionCard title="חלוקה לפי אפיקים ראשיים" icon="🥧">
          <div className="family-explanation" style={explanation}>
            התרשים מציג חלוקה משוקללת לפי צבירה של הקטגוריות הראשיות בכלל המוצרים.
          </div>

          <FullWidthDonutCard
            items={mainGroups.length ? mainGroups : products}
            formatCurrency={formatCurrency}
            emptyText="אין נתוני אפיקים להצגה"
          />
        </SectionCard>

        <SectionCard title="פירוט לפי בני משפחה" icon="👨‍👩‍👧‍👦">
          <div className="family-explanation" style={explanation}>
            מוצגת תמונת מצב אישית לכל אחד מבני המשפחה, כולל צבירה, הפקדה, קצבה
            צפויה, סכום חד הוני וכיסויים ביטוחיים.
          </div>

          {members.length ? (
            <div className="family-members-grid" style={membersGrid}>
              {members.map((member) => (
                <MemberCard
                  key={member?.id || member?.name}
                  member={member}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          ) : (
            <EmptyText>אין בני משפחה להצגה</EmptyText>
          )}
        </SectionCard>
      </div>

      <div className="family-print-page family-print-page-3">
        <SectionCard title="הלוואות על חשבון מוצרים פנסיוניים" icon="💳">
          <div className="family-explanation" style={explanation}>
            פירוט הלוואות לפי אדם עם סיכום כולל ויחס לנכסים.
          </div>

          {loanDetails.length ? (
            <>
              <div className="family-summary-grid" style={summaryStatsGrid}>
                <SmallStat
                  title="סה״כ הלוואות"
                  value={formatCurrency(totalLoansAmount)}
                />
                <SmallStat
                  title="יחס לנכסים"
                  value={`${loanRatioToAssets.toFixed(1)}%`}
                />
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
                      <tr key={loan?.id || index}>
                        <td style={td}>
                          {[loan?.firstName, loan?.familyName]
                            .filter(Boolean)
                            .join(" ") ||
                            loan?.name ||
                            "—"}
                        </td>
                        <td style={td}>{formatCurrency(loan?.amount)}</td>
                        <td style={td}>{formatCurrency(loan?.balance)}</td>
                        <td style={td}>{loan?.repaymentFrequency || "—"}</td>
                        <td style={td}>{formatDate(loan?.endDate)}</td>
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
          <div className="family-summary-grid" style={summaryStatsGrid}>
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

          <InfoBox
            label="יחס הלוואות לנכסים"
            value={`${loanRatioToAssets.toFixed(1)}%`}
          />
        </SectionCard>
      </div>
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
    <section className="family-hero" style={heroHeader}>
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
    <div className="family-kpi-card" style={kpiCard}>
      <div style={kpiIconWrap}>{icon}</div>
      <div style={kpiTitle}>{title}</div>
      <div className="family-kpi-value" style={kpiValue}>
        {value}
      </div>
      <div style={kpiSub}>{subtext}</div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <section className="family-section-card" style={sectionCard}>
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

function ExposureMetricBlock({ value, valueText, label, explanationText }) {
  return (
    <>
      <div className="family-explanation" style={explanation}>
        {explanationText}
      </div>

      <div style={equityValueWrap}>
        <div style={equityValue}>{valueText}</div>
        <div style={equityLabel}>{label}</div>
      </div>

      <ModernBar value={value} />
    </>
  );
}

function ComparisonChartCard({ title, explanation, bars }) {
  return (
    <section className="family-compare-card" style={compareCard}>
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
                  ...(bar.tone === "primary"
                    ? compareFillPrimary
                    : compareFillMuted),
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
    <section className="family-donut-card" style={donutCard}>
      <h3 style={donutTitle}>{title}</h3>
      <div style={{ ...smallText, marginTop: 6 }}>{subtitle}</div>

      {!data.segments.length ? (
        <EmptyText>אין נתונים להצגה</EmptyText>
      ) : (
        <div style={donutLayout}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutVisual
              gradient={data.gradient}
              size={102}
              holeInset="31%"
              soft
            />
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

  const total = data.segments.reduce(
    (sum, seg) => sum + Number(seg.value || 0),
    0
  );

  return (
    <div className="family-main-breakdown" style={mainBreakdownCardLayout}>
      <div style={mainDonutWrap}>
        <div
          className="family-main-donut"
          style={{
            width: 285,
            height: 285,
            borderRadius: "50%",
            background: `conic-gradient(${data.gradient})`,
            position: "relative",
            flexShrink: 0,
            boxShadow:
              "inset 0 0 0 3px rgba(255,255,255,0.95), inset 0 -10px 16px rgba(0,0,0,0.10), 0 12px 24px rgba(0,33,93,0.10)",
          }}
        >
          <div style={donutGloss} />
          <div
            style={{
              position: "absolute",
              inset: "30%",
              background: "#fff",
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxShadow:
                "inset 0 5px 10px rgba(0,33,93,0.05), 0 0 0 2px rgba(255,255,255,0.9)",
            }}
          >
            <div
              style={{
                color: theme.textSoft,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              סה"כ נכסים
            </div>
            <div
              style={{
                color: theme.navy,
                fontSize: 24,
                fontWeight: 900,
                lineHeight: 1.1,
                direction: "ltr",
              }}
            >
              {formatCurrency(total)}
            </div>
          </div>
        </div>
      </div>

      <div style={mainLegendWrap}>
        {data.segments.map((seg, index) => (
          <div
            className="family-main-legend-row"
            key={`${seg.id || seg.name}-${index}`}
            style={mainLegendRow}
          >
            <span style={{ ...mainLegendDot, background: seg.color }} />

            <div style={mainLegendName} title={seg.name}>
              {seg.name}
            </div>

            <div style={mainLegendValue}>{formatCurrency(seg.value)}</div>

            <div style={mainLegendPercent}>{Math.round(seg.percent)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutVisual({ gradient, size = 110, holeInset = "31%", soft = true }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        position: "relative",
        flexShrink: 0,
        background: `conic-gradient(${gradient})`,
        boxShadow: soft
          ? "inset 0 0 0 2px rgba(255,255,255,0.95), inset 0 -7px 10px rgba(0,0,0,0.12), 0 7px 14px rgba(0,33,93,0.10)"
          : "inset 0 0 0 3px rgba(255,255,255,0.95), inset 0 -10px 16px rgba(0,0,0,0.13), 0 12px 22px rgba(0,33,93,0.12)",
        transform: soft
          ? "perspective(700px) rotateX(4deg)"
          : "perspective(850px) rotateX(4deg)",
      }}
    >
      <div style={donutGloss} />
      <div
        style={{
          position: "absolute",
          inset: holeInset,
          background: "#fff",
          borderRadius: "50%",
          boxShadow:
            "inset 0 5px 10px rgba(0,33,93,0.05), 0 0 0 2px rgba(255,255,255,0.9)",
          transform: "rotateX(-4deg)",
        }}
      />
    </div>
  );
}

function buildSegments(items) {
  const safeItems = Array.isArray(items)
    ? items.filter((item) => Number(item.value || 0) > 0)
    : [];

  const total = safeItems.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

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
      <div style={legendPercent}>{Math.round(seg.percent)}%</div>
    </div>
  );
}

function MemberCard({ member, formatCurrency }) {
  const summary = member?.summary || {};
  const insurance = member?.insurance || {};

  return (
    <div className="family-member-card" style={memberCard}>
      <div style={memberTop}>
        <div>
          <div style={memberName}>{member?.name || "ללא שם"}</div>
        </div>

        <div style={chip}>
          הפקדה חודשית: {formatCurrency(summary.monthlyDeposits)}
        </div>
      </div>

      <div style={centerCard}>
        <div style={centerLabel}>סך צבירה</div>
        <div className="family-center-value" style={centerValue}>
          {formatCurrency(summary.totalAssets)}
        </div>
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
          <div style={insuranceValue}>
            {formatCurrency(insurance.deathCoverage)}
          </div>
        </div>

        <div style={insuranceCard}>
          <div style={insuranceLabel}>🧍 אובדן כושר עבודה</div>
          <div style={insuranceValue}>
            {formatCurrency(insurance.disabilityValue)} (
            {Math.round(Number(insurance.disabilityPercent || 0))}%)
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

const mainBreakdownCardLayout = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 0.9fr) minmax(360px, 1.1fr)",
  gap: 28,
  alignItems: "center",
  direction: "ltr",
};

const mainDonutWrap = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minWidth: 0,
};

const mainLegendWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
  minWidth: 0,
  direction: "rtl",
};

const mainLegendRow = {
  display: "grid",
  gridTemplateColumns: "14px 1fr 96px 46px",
  gap: 10,
  alignItems: "center",
  minHeight: 44,
  padding: "9px 0",
  borderBottom: "1px solid #E8E1D7",
};

const mainLegendDot = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  display: "inline-block",
  boxShadow: "0 1px 3px rgba(16,42,67,0.15)",
};

const mainLegendName = {
  color: theme.navy,
  fontWeight: 800,
  fontSize: 13,
  textAlign: "right",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const mainLegendValue = {
  color: theme.navy,
  fontWeight: 800,
  fontSize: 12,
  textAlign: "right",
  direction: "ltr",
  whiteSpace: "nowrap",
};

const mainLegendPercent = {
  color: theme.navy,
  fontWeight: 800,
  fontSize: 13,
  textAlign: "left",
  direction: "ltr",
};

const donutGloss = {
  position: "absolute",
  inset: 0,
  borderRadius: "50%",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 42%, rgba(0,0,0,0.10) 100%)",
  pointerEvents: "none",
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

