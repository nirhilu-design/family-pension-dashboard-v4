import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_CLIENT_MODEL_KEY = "familyPensionClientModel";
const STORAGE_REPORT_DATA_KEY = "familyPensionReportData";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildClientModelFromReportData(reportData) {
  const data = reportData || {};
  const family = data.family || {};

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
      products: safeArray(data.products),
      managers: safeArray(data.managers),
      mainGroups: safeArray(data.mainGroupAllocation),
      mainGroupAllocation: safeArray(data.mainGroupAllocation),
      assetClasses: safeArray(data.mainGroupAllocation),
      foreignExposureAllocation: safeArray(data.foreignExposureAllocation),
    },

    members: safeArray(data.members).map((member, index) => ({
      id: member.id || member.name || `member-${index}`,
      name: member.name || "ללא שם",

      summary: {
        totalAssets: Number(member.assets || member.totalAssets || 0),
        monthlyDeposits: Number(member.monthlyDeposits || 0),
        monthlyPensionWithDeposits: Number(
          member.monthlyPensionWithDeposits || 0
        ),
        monthlyPensionWithoutDeposits: Number(
          member.monthlyPensionWithoutDeposits || 0
        ),
        projectedLumpSumWithDeposits: Number(
          member.lumpSumWithDeposits ||
            member.projectedLumpSumWithDeposits ||
            0
        ),
        projectedLumpSumWithoutDeposits: Number(
          member.lumpSumWithoutDeposits ||
            member.projectedLumpSumWithoutDeposits ||
            0
        ),
      },

      insurance: {
        deathCoverage: Number(member.deathCoverage || 0),
        disabilityValue: Number(member.disabilityValue || 0),
        disabilityPercent: Number(member.disabilityPercent || 0),
      },
    })),

    loans: {
      hasData: Boolean(data.loans?.hasData),
      details: safeArray(data.loans?.details),
    },

    sourceReportData: data,
  };
}

function saveClientDashboardData(reportData) {
  const clientModel = buildClientModelFromReportData(reportData);

  const clientModelJson = JSON.stringify(clientModel);
  const reportDataJson = JSON.stringify(reportData);

  localStorage.setItem(STORAGE_CLIENT_MODEL_KEY, clientModelJson);
  localStorage.setItem(STORAGE_REPORT_DATA_KEY, reportDataJson);

  // Backup keys for older/alternate dashboard implementations.
  localStorage.setItem("clientModel", clientModelJson);
  localStorage.setItem("reportData", reportDataJson);
  sessionStorage.setItem(STORAGE_CLIENT_MODEL_KEY, clientModelJson);
  sessionStorage.setItem(STORAGE_REPORT_DATA_KEY, reportDataJson);
  sessionStorage.setItem("clientModel", clientModelJson);
  sessionStorage.setItem("reportData", reportDataJson);

  window.__familyPensionClientModel = clientModel;
  window.__familyPensionReportData = reportData;

  return clientModel;
}

export default function ReportPage({
  reportData,
  onBack,
  onResetAll = () => {},
  onOpenClientDashboard = () => {},
  onCreateShareLink = () => null,
}) {
  const [recommendations, setRecommendations] = useState(
    `1. מומלץ לבחון את הפער בין הקצבה הצפויה עם המשך הפקדות לבין ללא המשך הפקדות.
2. מומלץ לבדוק האם יש ריכוז יתר במוצרים או בגופים מנהלים מסוימים.
3. מומלץ לעבור על הכיסויים הביטוחיים ולוודא שהם מתאימים לצרכים המשפחתיים.
4. מומלץ לבחון את מדיניות ההשקעה ורמת החשיפה למניות בהתאם לפרופיל הסיכון הרצוי.`
  );

  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  const [isClientLinkCopied, setIsClientLinkCopied] = useState(false);
  const clientMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        clientMenuRef.current &&
        !clientMenuRef.current.contains(event.target)
      ) {
        setIsClientMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  const safeReportData = reportData || {};

  const {
    family = {},
    members = [],
    products = [],
    managers = [],
    mainGroupAllocation = [],
    foreignExposureAllocation = [],
    weightedForeignExposure = 0,
    loans = { hasData: false, details: [] },
    weightedEquityExposure = 0,
  } = safeReportData;

  const vestedBalanceTable = safeReportData?.vestedBalanceTable || null;
  const hasVestedBalanceTable =
    Array.isArray(vestedBalanceTable?.rows) && vestedBalanceTable.rows.length > 0;

  const handleExportPdf = () => {
    window.print();
  };

  const copyTextToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  };

  const handleCreateClientLink = async () => {
    if (!reportData || !reportData.family) {
      alert("אין דוח מוכן ליצירת לינק. קודם יש להפיק דוח.");
      return;
    }

    const result = onCreateShareLink({ expirationHours: 24 });

    if (!result?.success || !result?.url) {
      alert(result?.error || "לא ניתן היה ליצור לינק ללקוח.");
      return;
    }

    try {
      await copyTextToClipboard(result.url);
    } catch (error) {
      console.error("Failed to copy client link", error);
      window.prompt("העתק את הלינק ללקוח:", result.url);
    }

    setIsClientLinkCopied(true);
    window.setTimeout(() => setIsClientLinkCopied(false), 3500);
  };

  const handleOpenMemberReport = (member, index) => {
    if (!reportData || !reportData.family) {
      alert("אין דוח מוכן לפתיחה. קודם יש להפיק דוח.");
      return;
    }

    const memberId = member?.id || member?.name || `member-${index}`;

    setIsClientMenuOpen(false);

    onOpenClientDashboard({
      view: "member",
      memberId,
      memberName: member?.name || "ללא שם",
    });
  };

  const handleOpenFamilyClientView = () => {
    if (!reportData || !reportData.family) {
      alert("אין דוח מוכן לפתיחה. קודם יש להפיק דוח.");
      return;
    }

    setIsClientMenuOpen(false);
    onOpenClientDashboard({ view: "family" });
  };

  const formatCurrency = (value) =>
    `₪${Math.round(Number(value || 0)).toLocaleString("en-US")}`;

  const formatPercentLabel = (value) => `${Math.round(Number(value || 0))}%`;

  const formatDate = (value) => {
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
  };

  const normalizedLoanDetails = Array.isArray(loans?.details)
    ? loans.details
        .map((loan, index) => ({
          id:
            loan.id ||
            `${loan.firstName || ""}_${loan.familyName || ""}_${
              loan.endDate || ""
            }_${index}`,
          firstName: loan.firstName || "",
          familyName: loan.familyName || "",
          amount: Number(loan.amount || 0),
          repaymentFrequency: loan.repaymentFrequency || "",
          balance: Number(loan.balance || 0),
          endDate: loan.endDate || "",
        }))
        .filter(
          (loan) =>
            loan.firstName ||
            loan.familyName ||
            loan.amount ||
            loan.balance ||
            loan.repaymentFrequency ||
            loan.endDate
        )
    : [];

  const groupedLoans = normalizedLoanDetails.reduce((acc, loan) => {
    const personName =
      [loan.firstName, loan.familyName].filter(Boolean).join(" ").trim() ||
      "ללא שיוך";

    if (!acc[personName]) acc[personName] = [];
    acc[personName].push(loan);
    return acc;
  }, {});

  const hasDetailedLoans = normalizedLoanDetails.length > 0;

  const totalLoansAmount = normalizedLoanDetails.reduce(
    (sum, loan) => sum + (loan.amount || 0),
    0
  );

  const loanRatioToAssets =
    Number(family.totalAssets || 0) > 0
      ? (totalLoansAmount / Number(family.totalAssets || 0)) * 100
      : 0;

  const retirementLumpBars = useMemo(() => {
    const withDeposits = Number(family.projectedLumpSumWithDeposits || 0);
    const withoutDeposits = Number(family.projectedLumpSumWithoutDeposits || 0);
    const maxValue = Math.max(withDeposits, withoutDeposits, 1);

    return [
      {
        label: "עם הפקדות",
        value: withDeposits,
        display: formatCurrency(withDeposits),
        ratio: (withDeposits / maxValue) * 100,
        tone: "primary",
      },
      {
        label: "ללא הפקדות",
        value: withoutDeposits,
        display: formatCurrency(withoutDeposits),
        ratio: (withoutDeposits / maxValue) * 100,
        tone: "muted",
      },
    ];
  }, [
    family.projectedLumpSumWithDeposits,
    family.projectedLumpSumWithoutDeposits,
  ]);

  const retirementPensionBars = useMemo(() => {
    const withDeposits = Number(family.monthlyPensionWithDeposits || 0);
    const withoutDeposits = Number(family.monthlyPensionWithoutDeposits || 0);
    const maxValue = Math.max(withDeposits, withoutDeposits, 1);

    return [
      {
        label: "עם הפקדות",
        value: withDeposits,
        display: formatCurrency(withDeposits),
        ratio: (withDeposits / maxValue) * 100,
        tone: "primary",
      },
      {
        label: "ללא הפקדות",
        value: withoutDeposits,
        display: formatCurrency(withoutDeposits),
        ratio: (withoutDeposits / maxValue) * 100,
        tone: "muted",
      },
    ];
  }, [
    family.monthlyPensionWithDeposits,
    family.monthlyPensionWithoutDeposits,
  ]);

  const exposureLabel =
    weightedEquityExposure <= 30
      ? "חשיפה נמוכה"
      : weightedEquityExposure <= 60
      ? "חשיפה בינונית"
      : "חשיפה גבוהה";

  const pageBg = "#F9F7F3";
  const surface = "#FFFFFF";
  const surfaceAlt = "#FCFBF8";
  const border = "#E2D1BF";
  const divider = "#EEE4D8";
  const text = "#102A43";
  const textSoft = "#627D98";
  const navy = "#00215D";
  const accent = "#FF2756";
  const blue = "#1F77B4";
  const cyan = "#43B5D9";
  const purple = "#8F63C9";
  const gold = "#F0B43C";
  const mutedBar = "#C7D1E2";
  const softBlue = "#EAF1FB";
  const buttonBorder = "#D9DDE8";

  const brandChartColors = [
    navy,
    accent,
    blue,
    cyan,
    purple,
    gold,
    "#9FD0E6",
    "#58BF78",
    "#B79ADE",
    "#A8B0BA",
  ];

  const styles = {
    page: {
      minHeight: "100vh",
      background: pageBg,
      padding: "24px",
      direction: "rtl",
      fontFamily: 'Calibri, "Arial", sans-serif',
      color: text,
      boxSizing: "border-box",
      fontSize: "12px",
      lineHeight: 1.6,
    },
    actionsBar: {
      maxWidth: "1280px",
      margin: "0 auto 18px",
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      direction: "rtl",
      alignItems: "center",
    },
    container: {
      maxWidth: "1280px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },
    sectionCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    heroHeader: {
      background: `linear-gradient(135deg, ${navy}, #001845)`,
      color: "#fff",
      borderRadius: "24px",
      padding: "24px 26px",
      boxShadow: "0 8px 28px rgba(0,33,93,0.14)",
      display: "grid",
      gridTemplateColumns: "1.05fr 2fr 1.05fr",
      alignItems: "center",
      gap: "16px",
      direction: "ltr",
      overflow: "hidden",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    heroMeta: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "flex-end",
      justifySelf: "end",
      direction: "rtl",
      minWidth: 0,
    },
    heroMetaLabel: {
      fontSize: "12px",
      color: "rgba(255,255,255,0.75)",
    },
    heroMetaValue: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#fff",
    },
    heroCenter: {
      textAlign: "center",
      direction: "rtl",
      minWidth: 0,
    },
    heroEyebrow: {
      fontSize: "12px",
      color: "rgba(255,255,255,0.78)",
      marginBottom: "8px",
      fontWeight: 700,
    },
    heroTitle: {
      margin: 0,
      fontSize: "30px",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#fff",
    },
    heroSubtitle: {
      margin: "12px auto 0",
      maxWidth: "760px",
      fontSize: "12px",
      lineHeight: 1.8,
      color: "rgba(255,255,255,0.9)",
    },
    heroLogoWrap: {
      justifySelf: "start",
      direction: "ltr",
      minWidth: 0,
    },
    heroClientLogoBox: {
      width: "178px",
      height: "64px",
      borderRadius: "16px",
      background: "rgba(255,255,255,0.11)",
      border: "1px solid rgba(255,255,255,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      padding: "8px",
      boxSizing: "border-box",
    },
    heroClientLogoImage: {
      display: "block",
      maxWidth: "100%",
      maxHeight: "100%",
      width: "auto",
      height: "auto",
      objectFit: "contain",
    },
    heroClientLogoPlaceholder: {
      width: "100%",
      height: "100%",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.13)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.58)",
      fontSize: "11px",
      fontWeight: 700,
    },
    topGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "18px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    kpiCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "20px",
      padding: "20px",
      minHeight: "188px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
      breakInside: "avoid",
      pageBreakInside: "avoid",
      transition: "all 0.2s ease",
    },
    kpiIconWrap: {
      width: "74px",
      height: "74px",
      borderRadius: "22px",
      background: "#F4F7FB",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginBottom: "14px",
    },
    kpiTitle: {
      fontSize: "14px",
      color: textSoft,
      fontWeight: 700,
      marginBottom: "10px",
      textAlign: "center",
    },
    kpiValue: {
      fontSize: "34px",
      lineHeight: 1.1,
      fontWeight: 700,
      color: navy,
      marginBottom: "10px",
      textAlign: "center",
    },
    kpiSub: {
      fontSize: "12px",
      color: "#7A8CA8",
      lineHeight: 1.7,
      textAlign: "center",
      maxWidth: "260px",
      margin: "0 auto",
    },
    donutCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "20px",
      padding: "18px",
      minHeight: "188px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    donutTitle: {
      margin: 0,
      color: navy,
      fontSize: "14px",
      fontWeight: 700,
    },
    smallText: {
      fontSize: "12px",
      color: textSoft,
      lineHeight: 1.6,
    },
    donutLayout: {
      display: "grid",
      gridTemplateColumns: "110px 1fr",
      gap: "14px",
      alignItems: "center",
      marginTop: "12px",
    },
    compareGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "18px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    compareCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "20px",
      padding: "20px",
      minHeight: "210px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    compareTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: navy,
      marginBottom: "8px",
    },
    compareDesc: {
      fontSize: "12px",
      color: textSoft,
      lineHeight: 1.7,
      marginBottom: "18px",
    },
    compareBarList: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    },
    compareBarItem: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    compareBarTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
    },
    compareBarLabel: {
      fontSize: "12px",
      color: "#4A5D7A",
      fontWeight: 700,
    },
    compareBarValue: {
      fontSize: "18px",
      color: navy,
      fontWeight: 700,
    },
    compareTrack: {
      width: "100%",
      height: "18px",
      borderRadius: "999px",
      background: softBlue,
      overflow: "hidden",
    },
    compareFillPrimary: {
      height: "100%",
      borderRadius: "999px",
      background: `linear-gradient(90deg, ${accent}, ${navy})`,
    },
    compareFillMuted: {
      height: "100%",
      borderRadius: "999px",
      background: mutedBar,
    },
    lowerTwoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "18px",
      alignItems: "stretch",
    },
    equityCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "20px",
      padding: "20px",
      minHeight: "210px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    equityValueWrap: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "18px",
    },
    equityValue: {
      fontSize: "34px",
      lineHeight: 1.1,
      fontWeight: 700,
      color: navy,
    },
    equityLabel: {
      fontSize: "14px",
      fontWeight: 700,
      color: textSoft,
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "10px",
    },
    titleWithIcon: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    h2: {
      margin: 0,
      fontSize: "14px",
      color: navy,
      fontWeight: 700,
      lineHeight: 1.4,
    },
    explanation: {
      fontSize: "12px",
      color: textSoft,
      lineHeight: 1.7,
      marginBottom: "16px",
    },
    bottomGrid: {
      display: "grid",
      gridTemplateColumns: "1.35fr 0.9fr",
      gap: "18px",
      alignItems: "start",
    },
    summaryStatsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "14px",
    },
    statCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "14px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    statLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "8px",
    },
    statValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: navy,
    },
    simpleInfoBox: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "16px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    infoLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "8px",
    },
    infoValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.5,
    },
    membersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "18px",
      alignItems: "start",
    },
    memberCard: {
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "20px",
      padding: "18px",
      boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
      boxSizing: "border-box",
      breakInside: "avoid",
      pageBreakInside: "avoid",
      alignSelf: "start",
    },
    memberTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
      marginBottom: "14px",
    },
    memberName: {
      fontSize: "18px",
      fontWeight: 700,
      color: navy,
      marginBottom: "4px",
    },
    chip: {
      display: "inline-block",
      padding: "8px 12px",
      border: `1px solid ${divider}`,
      borderRadius: "999px",
      background: surfaceAlt,
      fontSize: "12px",
      color: "#486581",
      fontWeight: 700,
    },
    centerCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "16px",
      padding: "18px",
      textAlign: "center",
      marginBottom: "12px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    centerLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "8px",
    },
    centerValue: {
      fontSize: "24px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.15,
    },
    compareMiniGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
      alignItems: "start",
    },
    compareMiniCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "16px",
      padding: "14px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    compareMiniTitle: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "10px",
      fontWeight: 700,
    },
    compareMiniInner: {
      display: "grid",
      gridTemplateColumns: "1fr 1px 1fr",
      gap: "10px",
      alignItems: "stretch",
    },
    dividerLine: {
      background: divider,
      width: "1px",
    },
    compareMiniSide: {
      textAlign: "center",
    },
    compareMiniSideLabel: {
      fontSize: "11px",
      color: textSoft,
      marginBottom: "6px",
    },
    compareMiniSideValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.2,
    },
    insuranceGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      alignItems: "start",
    },
    insuranceCard: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "12px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    insuranceLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "6px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    insuranceValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: navy,
      lineHeight: 1.2,
    },
    loansBenefitsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "18px",
      alignItems: "start",
    },
    emptyState: {
      background: surfaceAlt,
      border: `1px dashed ${border}`,
      borderRadius: "14px",
      padding: "18px",
      fontSize: "12px",
      color: textSoft,
      lineHeight: 1.7,
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    loanGroup: {
      background: surfaceAlt,
      border: `1px solid ${divider}`,
      borderRadius: "16px",
      padding: "14px",
      marginTop: "12px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    loanPersonName: {
      fontSize: "14px",
      fontWeight: 700,
      color: navy,
      marginBottom: "12px",
    },
    loanSummaryRow: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      marginBottom: "12px",
      alignItems: "start",
    },
    loanSummaryCard: {
      background: "#fff",
      border: `1px solid ${divider}`,
      borderRadius: "14px",
      padding: "12px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    loanSummaryLabel: {
      fontSize: "12px",
      color: textSoft,
      marginBottom: "6px",
    },
    loanSummaryValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: navy,
    },
    loanTableWrap: {
      overflowX: "auto",
      marginTop: "8px",
      borderRadius: "14px",
      border: `1px solid ${divider}`,
      background: "#fff",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    loanTable: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "620px",
      background: "#fff",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    loanTh: {
      textAlign: "right",
      fontSize: "12px",
      color: textSoft,
      borderBottom: `1px solid ${divider}`,
      padding: "12px 10px",
      fontWeight: 700,
      whiteSpace: "nowrap",
      background: "#FAF8F4",
    },
    loanTd: {
      textAlign: "right",
      fontSize: "12px",
      color: text,
      borderBottom: "1px solid #F0E6DA",
      padding: "12px 10px",
      whiteSpace: "nowrap",
    },
    vestedTableWrap: {
      overflowX: "auto",
      marginTop: "12px",
      borderRadius: "16px",
      border: `1px solid ${divider}`,
      background: "#fff",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    vestedTable: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "980px",
      background: "#fff",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    vestedTh: {
      textAlign: "center",
      fontSize: "12px",
      color: "#fff",
      background: navy,
      borderLeft: "1px solid rgba(255,255,255,0.15)",
      padding: "12px 10px",
      fontWeight: 800,
      whiteSpace: "normal",
      lineHeight: 1.35,
    },
    vestedTd: {
      textAlign: "center",
      fontSize: "12px",
      color: text,
      borderBottom: "1px solid #F0E6DA",
      borderLeft: "1px solid #F0E6DA",
      padding: "12px 10px",
      whiteSpace: "nowrap",
      background: "#fff",
    },
    vestedTotalTd: {
      textAlign: "center",
      fontSize: "12px",
      color: navy,
      borderBottom: "1px solid #D8DEE9",
      borderLeft: "1px solid #D8DEE9",
      padding: "12px 10px",
      whiteSpace: "nowrap",
      background: "#EEF2FA",
      fontWeight: 900,
    },
    recommendationsWrap: {
      background: "#fff",
      border: `1px solid ${divider}`,
      borderRadius: "18px",
      padding: "18px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    recommendationsText: {
      width: "100%",
      minHeight: "180px",
      resize: "vertical",
      border: `1px solid ${border}`,
      borderRadius: "14px",
      padding: "16px",
      fontSize: "12px",
      lineHeight: 1.8,
      color: text,
      boxSizing: "border-box",
      fontFamily: 'Calibri, "Arial", sans-serif',
      background: "#FFFDFB",
    },
    recommendationsPrintText: {
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      fontSize: "12px",
      lineHeight: 1.9,
      color: text,
      background: "#FFFDFB",
      border: `1px solid ${border}`,
      borderRadius: "14px",
      padding: "16px",
      minHeight: "120px",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
    footer: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      fontSize: "11px",
      color: textSoft,
      padding: "0 4px 6px",
      flexWrap: "wrap",
      breakInside: "avoid",
      pageBreakInside: "avoid",
    },
  };

  if (!reportData || !reportData.family) {
    return (
      <div style={{ padding: "40px", direction: "rtl" }}>טוען נתונים...</div>
    );
  }

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            font-family: Calibri, Arial, sans-serif;
            font-size: 12px;
          }

          .print-section,
          .avoid-break,
          .avoid-break * {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          table,
          thead,
          tbody,
          tfoot,
          tr,
          th,
          td {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .action-button {
            padding: 12px 18px;
            min-height: 42px;
            border-radius: 12px;
            border: 1px solid ${buttonBorder};
            background: #ffffff;
            color: #102A43;
            font-weight: 800;
            font-family: Calibri, Arial, sans-serif;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.18s ease;
            min-width: 160px;
            white-space: nowrap;
          }

          .action-button:hover {
            border-color: ${navy};
            color: ${navy};
            transform: translateY(-1px);
          }

          .action-button:active {
            transform: translateY(0);
          }

          .action-button.primary {
            border-color: ${navy};
            background: ${navy};
            color: #ffffff;
            box-shadow: 0 6px 14px rgba(0, 33, 93, 0.16);
          }

          .action-button.primary:hover {
            border-color: #001845;
            background: #001845;
            color: #ffffff;
          }

          .action-button.accent {
            border-color: ${accent};
            background: ${accent};
            color: #ffffff;
            box-shadow: 0 6px 14px rgba(255, 39, 86, 0.16);
          }

          .action-button.accent:hover {
            border-color: #e61f4d;
            background: #e61f4d;
            color: #ffffff;
          }

          .action-button.danger {
            background: #ffffff;
            color: ${accent};
            border-color: ${accent};
          }

          .action-button.danger:hover {
            background: #fff0f3;
            border-color: ${accent};
            color: ${accent};
          }

          .action-button:focus-visible {
            outline: 2px solid rgba(0, 33, 93, 0.22);
            outline-offset: 2px;
          }

          .client-menu-wrap {
            position: relative !important;
            display: inline-flex !important;
            order: -100;
          }

          .hamburger-button {
            width: 48px !important;
            min-width: 48px !important;
            height: 44px !important;
            padding: 0 !important;
            font-size: 0 !important;
            line-height: 1 !important;
            border-radius: 14px !important;
            position: relative !important;
          }

          .hamburger-button::before {
            content: "";
            width: 20px;
            height: 14px;
            display: block;
            background:
              linear-gradient(#00215D, #00215D) 0 0 / 20px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 6px / 20px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 12px / 20px 2px no-repeat;
            margin: 0 auto;
          }

          .client-menu-panel {
            position: absolute !important;
            top: 54px !important;
            right: 0 !important;
            left: auto !important;
            width: 280px !important;
            max-width: calc(100vw - 28px) !important;
            background: #FFFFFF !important;
            border: 1px solid #E9DCCF !important;
            border-radius: 20px !important;
            box-shadow: 0 24px 54px rgba(0, 33, 93, 0.18) !important;
            padding: 14px !important;
            z-index: 9999 !important;
            text-align: right !important;
          }

          .client-menu-panel::before {
            content: "";
            position: absolute;
            top: -8px;
            right: 18px;
            width: 16px;
            height: 16px;
            background: #FFFFFF;
            border-top: 1px solid #E9DCCF;
            border-right: 1px solid #E9DCCF;
            transform: rotate(-45deg);
          }

          .client-menu-title {
            color: #00215D !important;
            font-size: 14px !important;
            font-weight: 900 !important;
            margin: 0 0 4px !important;
            padding: 2px 2px 0 !important;
          }

          .client-menu-subtitle {
            color: #627D98 !important;
            font-size: 11px !important;
            line-height: 1.55 !important;
            margin: 0 0 12px !important;
            padding: 0 2px 10px !important;
            border-bottom: 1px solid #EEE4D8 !important;
          }

          .client-menu-member-row {
            width: 100% !important;
            border: 1px solid #EEE4D8 !important;
            background: linear-gradient(180deg, #FFFFFF 0%, #FCFBF8 100%) !important;
            border-radius: 14px !important;
            min-height: 48px !important;
            padding: 0 14px !important;
            margin: 0 0 9px !important;
            display: grid !important;
            grid-template-columns: 1fr 24px !important;
            gap: 10px !important;
            align-items: center !important;
            cursor: pointer !important;
            font-family: Calibri, Arial, sans-serif !important;
            text-align: right !important;
            transition: all 0.16s ease !important;
          }

          .client-menu-member-row:hover {
            border-color: #00215D !important;
            background: #F4F7FB !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 18px rgba(0, 33, 93, 0.08) !important;
          }

          .client-menu-member-row:last-child {
            margin-bottom: 0 !important;
          }

          .client-menu-member-name {
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            color: #102A43 !important;
            font-size: 14px !important;
            font-weight: 900 !important;
          }

          .client-menu-member-arrow {
            width: 24px !important;
            height: 24px !important;
            border-radius: 50% !important;
            background: #EAF1FB !important;
            color: #00215D !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            transform: rotate(180deg) !important;
          }

          .client-menu-empty {
            border: 1px dashed #E2D1BF !important;
            background: #FCFBF8 !important;
            color: #627D98 !important;
            border-radius: 14px !important;
            padding: 14px !important;
            font-size: 12px !important;
            text-align: center !important;
          }

          .client-link-button-wrap {
            position: relative !important;
            display: inline-flex !important;
            align-items: center !important;
          }

          .client-link-success-check {
            position: absolute !important;
            right: -9px !important;
            top: -9px !important;
            width: 21px !important;
            height: 21px !important;
            border-radius: 50% !important;
            background: #20B26B !important;
            color: #ffffff !important;
            border: 2px solid #ffffff !important;
            box-shadow: 0 4px 10px rgba(32,178,107,0.25) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
          }

          .client-menu-wrap {
            position: relative;
            display: inline-flex;
          }

          .hamburger-button {
            width: 46px;
            min-width: 46px;
            padding: 0;
            font-size: 22px;
            line-height: 1;
          }

          .client-menu-panel {
            position: absolute !important;
            top: 56px !important;
            right: 0 !important;
            left: auto !important;
            width: 316px !important;
            max-width: calc(100vw - 32px) !important;
            background: rgba(255, 255, 255, 0.98) !important;
            border: 1px solid #E2D1BF !important;
            border-radius: 22px !important;
            box-shadow: 0 18px 40px rgba(16,42,67,0.16) !important;
            padding: 18px !important;
            z-index: 100 !important;
            backdrop-filter: blur(8px);
          }

          .client-menu-title {
            color: #00215D;
            font-size: 15px;
            font-weight: 900;
            margin-bottom: 6px;
          }

          .client-menu-subtitle {
            color: #627D98;
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 14px;
          }

          .client-menu-member-row {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            gap: 10px !important;
            align-items: center !important;
            padding: 14px 16px !important;
            border: 1px solid #EEE4D8 !important;
            border-radius: 14px !important;
            background: #FFFFFF !important;
            cursor: pointer !important;
            font-family: Calibri, Arial, sans-serif !important;
            text-align: right !important;
            margin-bottom: 10px !important;
            transition: all 0.18s ease !important;
          }

          .client-menu-member-row:hover {
            border-color: #00215D !important;
            background: #F4F7FB !important;
            transform: translateY(-1px);
          }

          .client-menu-member-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #102A43;
            font-size: 14px;
            font-weight: 900;
          }

          .client-menu-member-arrow {
            color: #00215D;
            font-size: 22px;
            font-weight: 900;
            line-height: 1;
            transform: rotate(180deg);
          }

          .client-menu-empty {
            border: 1px dashed #E2D1BF;
            background: #FCFBF8;
            color: #627D98;
            border-radius: 14px;
            padding: 14px;
            font-size: 12px;
            text-align: center;
          }

          .client-link-button-wrap {
            position: relative;
            display: inline-flex;
            align-items: center;
          }

          .client-link-success-check {
            position: absolute;
            right: -10px;
            top: -8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #20B26B;
            color: #ffffff;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(32,178,107,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 900;
            line-height: 1;
          }

          .client-menu-wrap {
            position: relative;
            display: inline-flex;
          }

          .hamburger-button {
            width: 46px;
            min-width: 46px;
            padding: 0;
            font-size: 22px;
            line-height: 1;
          }

          .client-menu-panel {
            position: absolute;
            top: 52px;
            right: 0;
            width: 300px;
            max-width: calc(100vw - 32px);
            background: #ffffff;
            border: 1px solid #E2D1BF;
            border-radius: 18px;
            box-shadow: 0 16px 34px rgba(16,42,67,0.16);
            padding: 14px;
            z-index: 50;
          }

          .client-menu-title {
            color: #00215D;
            font-size: 14px;
            font-weight: 900;
            margin-bottom: 4px;
          }

          .client-menu-subtitle {
            color: #627D98;
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 12px;
          }

          .client-menu-section {
            border-top: 1px solid #EEE4D8;
            padding-top: 12px;
            margin-top: 12px;
          }

          .client-menu-member-row {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 13px 12px;
            border: 1px solid #EEE4D8;
            border-radius: 12px;
            background: #FFFFFF;
            cursor: pointer;
            font-family: Calibri, Arial, sans-serif;
            text-align: right;
            margin-bottom: 8px;
          }

          .client-menu-member-row:hover {
            border-color: #00215D;
            background: #F4F7FB;
          }

          .client-menu-member-row::after {
            content: "›";
            color: #00215D;
            font-size: 20px;
            font-weight: 900;
            transform: rotate(180deg);
          }

          .client-menu-member-row:last-child {
            margin-bottom: 0;
          }

          .client-menu-member-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #102A43;
            font-size: 13px;
            font-weight: 800;
          }

          .client-menu-mini-button {
            min-height: 34px;
            padding: 7px 10px;
            border: 1px solid #D9DDE8;
            border-radius: 10px;
            background: #ffffff;
            color: #00215D;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            font-family: Calibri, Arial, sans-serif;
            white-space: nowrap;
          }

          .client-menu-mini-button:hover {
            border-color: #00215D;
            background: #F4F7FB;
          }

          .client-link-button-wrap {
            position: relative;
            display: inline-flex;
            align-items: center;
          }

          .client-link-success-check {
            position: absolute;
            right: -10px;
            top: -8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #20B26B;
            color: #ffffff;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(32,178,107,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 900;
            line-height: 1;
          }


          /* Final client-actions menu design */
          .client-menu-wrap {
            position: relative !important;
            display: inline-flex !important;
            order: -100 !important;
          }

          .hamburger-button {
            width: 48px !important;
            min-width: 48px !important;
            height: 44px !important;
            padding: 0 !important;
            font-size: 0 !important;
            line-height: 1 !important;
            border-radius: 14px !important;
            position: relative !important;
            background: #ffffff !important;
          }

          .hamburger-button::before {
            content: "";
            width: 20px;
            height: 14px;
            display: block;
            background:
              linear-gradient(#00215D, #00215D) 0 0 / 20px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 6px / 20px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 12px / 20px 2px no-repeat;
            margin: 0 auto;
          }

          .client-menu-panel {
            position: absolute !important;
            top: 54px !important;
            right: 0 !important;
            left: auto !important;
            width: 288px !important;
            max-width: calc(100vw - 28px) !important;
            background: #FFFFFF !important;
            border: 1px solid #E9DCCF !important;
            border-radius: 20px !important;
            box-shadow: 0 24px 54px rgba(0, 33, 93, 0.18) !important;
            padding: 14px !important;
            z-index: 9999 !important;
            text-align: right !important;
          }

          .client-menu-panel::before {
            content: "";
            position: absolute;
            top: -8px;
            right: 18px;
            width: 16px;
            height: 16px;
            background: #FFFFFF;
            border-top: 1px solid #E9DCCF;
            border-right: 1px solid #E9DCCF;
            transform: rotate(-45deg);
          }

          .client-menu-title {
            color: #00215D !important;
            font-size: 14px !important;
            font-weight: 900 !important;
            margin: 0 0 4px !important;
            padding: 2px 2px 0 !important;
          }

          .client-menu-subtitle {
            color: #627D98 !important;
            font-size: 11px !important;
            line-height: 1.55 !important;
            margin: 0 0 12px !important;
            padding: 0 2px 10px !important;
            border-bottom: 1px solid #EEE4D8 !important;
          }

          .client-menu-member-row {
            width: 100% !important;
            border: 1px solid #EEE4D8 !important;
            background: linear-gradient(180deg, #FFFFFF 0%, #FCFBF8 100%) !important;
            border-radius: 14px !important;
            min-height: 48px !important;
            padding: 0 14px !important;
            margin: 0 0 9px !important;
            display: grid !important;
            grid-template-columns: 1fr 24px !important;
            gap: 10px !important;
            align-items: center !important;
            cursor: pointer !important;
            font-family: Calibri, Arial, sans-serif !important;
            text-align: right !important;
            transition: all 0.16s ease !important;
          }

          .client-menu-member-row:hover {
            border-color: #00215D !important;
            background: #F4F7FB !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 18px rgba(0, 33, 93, 0.08) !important;
          }

          .client-menu-member-row:last-child {
            margin-bottom: 0 !important;
          }

          .client-menu-member-name {
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            color: #102A43 !important;
            font-size: 14px !important;
            font-weight: 900 !important;
          }

          .client-menu-member-arrow {
            width: 24px !important;
            height: 24px !important;
            border-radius: 50% !important;
            background: #EAF1FB !important;
            color: #00215D !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            transform: rotate(180deg) !important;
          }

          .client-menu-empty {
            border: 1px dashed #E2D1BF !important;
            background: #FCFBF8 !important;
            color: #627D98 !important;
            border-radius: 14px !important;
            padding: 14px !important;
            font-size: 12px !important;
            text-align: center !important;
          }

          .client-link-button-wrap {
            position: relative !important;
            display: inline-flex !important;
            align-items: center !important;
          }

          .client-link-success-check {
            position: absolute !important;
            right: -9px !important;
            top: -9px !important;
            width: 21px !important;
            height: 21px !important;
            border-radius: 50% !important;
            background: #20B26B !important;
            color: #ffffff !important;
            border: 2px solid #ffffff !important;
            box-shadow: 0 4px 10px rgba(32,178,107,0.25) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
          }

          .kpi-card-hover:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 18px rgba(16,42,67,0.08) !important;
          }


          /* Unified client navigation menu - final override */
          .client-menu-wrap {
            position: relative !important;
            display: inline-flex !important;
            order: -100 !important;
            z-index: 10000 !important;
          }

          .client-hamburger-button,
          .hamburger-button {
            width: 48px !important;
            min-width: 48px !important;
            height: 44px !important;
            padding: 0 !important;
            border-radius: 14px !important;
            background: #ffffff !important;
            border: 1px solid #D9DDE8 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 2px 8px rgba(16,42,67,0.05) !important;
            font-size: 0 !important;
          }

          .client-hamburger-lines {
            width: 22px;
            height: 16px;
            display: block;
            background:
              linear-gradient(#00215D, #00215D) 0 0 / 22px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 7px / 22px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 14px / 22px 2px no-repeat;
          }

          .hamburger-button::before {
            content: "";
            width: 22px;
            height: 16px;
            display: block;
            background:
              linear-gradient(#00215D, #00215D) 0 0 / 22px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 7px / 22px 2px no-repeat,
              linear-gradient(#00215D, #00215D) 0 14px / 22px 2px no-repeat;
            margin: 0 auto;
          }

          .client-menu-panel {
            position: absolute !important;
            top: 56px !important;
            right: 0 !important;
            left: auto !important;
            width: 292px !important;
            max-width: calc(100vw - 28px) !important;
            background: #FFFFFF !important;
            border: 1px solid #E7D9CA !important;
            border-radius: 22px !important;
            box-shadow: 0 24px 54px rgba(0, 33, 93, 0.18) !important;
            padding: 14px !important;
            z-index: 99999 !important;
            text-align: right !important;
            direction: rtl !important;
          }

          .client-menu-panel::before {
            content: "";
            position: absolute;
            top: -8px;
            right: 18px;
            width: 16px;
            height: 16px;
            background: #FFFFFF;
            border-top: 1px solid #E7D9CA;
            border-right: 1px solid #E7D9CA;
            transform: rotate(-45deg);
          }

          .client-menu-title {
            color: #00215D !important;
            font-size: 14px !important;
            font-weight: 900 !important;
            margin: 0 0 4px !important;
            padding: 2px 2px 0 !important;
          }

          .client-menu-subtitle {
            color: #627D98 !important;
            font-size: 11px !important;
            line-height: 1.55 !important;
            margin: 0 0 12px !important;
            padding: 0 2px 10px !important;
            border-bottom: 1px solid #EEE4D8 !important;
          }

          .client-menu-member-row {
            width: 100% !important;
            border: 1px solid #EEE4D8 !important;
            background: linear-gradient(180deg, #FFFFFF 0%, #FCFBF8 100%) !important;
            border-radius: 14px !important;
            min-height: 48px !important;
            padding: 0 14px !important;
            margin: 0 0 9px !important;
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 24px !important;
            gap: 10px !important;
            align-items: center !important;
            cursor: pointer !important;
            font-family: Calibri, Arial, sans-serif !important;
            text-align: right !important;
            transition: all 0.16s ease !important;
          }

          .client-menu-member-row::after {
            content: none !important;
            display: none !important;
          }

          .client-menu-member-row:hover {
            border-color: #00215D !important;
            background: #F4F7FB !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 18px rgba(0, 33, 93, 0.08) !important;
          }

          .client-menu-member-row:last-child {
            margin-bottom: 0 !important;
          }

          .client-menu-member-name {
            min-width: 0 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            color: #102A43 !important;
            font-size: 14px !important;
            font-weight: 900 !important;
          }

          .client-menu-member-arrow {
            width: 24px !important;
            height: 24px !important;
            border-radius: 50% !important;
            background: #EAF1FB !important;
            color: #00215D !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            transform: rotate(180deg) !important;
          }

          .client-menu-empty {
            border: 1px dashed #E2D1BF !important;
            background: #FCFBF8 !important;
            color: #627D98 !important;
            border-radius: 14px !important;
            padding: 14px !important;
            font-size: 12px !important;
            text-align: center !important;
          }

          .client-link-button-wrap {
            position: relative !important;
            display: inline-flex !important;
            align-items: center !important;
          }

          .client-link-success-check {
            position: absolute !important;
            right: -9px !important;
            top: -9px !important;
            width: 21px !important;
            height: 21px !important;
            border-radius: 50% !important;
            background: #20B26B !important;
            color: #ffffff !important;
            border: 2px solid #ffffff !important;
            box-shadow: 0 4px 10px rgba(32,178,107,0.25) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 12px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
          }


          .responsive-hero-logo img,
          .responsive-hero-meta img {
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
          }

          @media print {
            .no-print,
            .client-menu-panel {
              display: none !important;
            }

            .print-only {
              display: block !important;
            }

            .screen-only {
              display: none !important;
            }

            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @page {
              size: A4 portrait;
              margin: 7mm;
            }

            .print-section {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .print-table-block {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .force-new-page-print {
              break-before: page !important;
              page-break-before: always !important;
            }

            .member-card-print,
            .loan-group-print,
            .recommendations-print,
            .summary-box-print,
            .foreign-exposure-print,
            .equity-print,
            .main-group-print {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .responsive-grid-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }

            .responsive-grid-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .responsive-bottom-grid {
              grid-template-columns: 1fr !important;
            }

            .members-section {
              break-before: page !important;
              page-break-before: always !important;
            }

            .loans-section {
              break-before: page !important;
              page-break-before: always !important;
            }

            html,
            body {
              width: 210mm !important;
              min-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
              direction: rtl !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              zoom: 1 !important;
            }

            .responsive-grid-4 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .responsive-grid-2,
            .responsive-lower-two,
            .responsive-members-grid,
            .responsive-loans-grid,
            .responsive-mini-grid,
            .responsive-insurance-grid,
            .responsive-loan-summary {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .responsive-bottom-grid {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }

            .print-section,
            .avoid-break,
            .member-card-print,
            .loan-group-print,
            .recommendations-print,
            .summary-box-print,
            .foreign-exposure-print,
            .equity-print,
            .main-group-print {
              max-width: 100% !important;
              overflow: visible !important;
              box-shadow: none !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .force-new-page-print,
            .members-section,
            .loans-section {
              break-before: auto !important;
              page-break-before: auto !important;
            }

            table {
              width: 100% !important;
              min-width: 100% !important;
            }

            th,
            td {
              font-size: 9px !important;
              padding: 6px !important;
            }

            .vested-balance-section {
              width: 100% !important;
              max-width: 100% !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .vested-balance-section table {
              min-width: 100% !important;
              table-layout: fixed !important;
            }

            .vested-balance-section th,
            .vested-balance-section td {
              font-size: 7.5px !important;
              padding: 5px 4px !important;
              white-space: normal !important;
              word-break: break-word !important;
            }
          }

          @media screen {
            .print-only {
              display: none !important;
            }

            .screen-only {
              display: block !important;
            }
          }

          @media (max-width: 1180px) {
            .responsive-grid-4 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .responsive-grid-2,
            .responsive-bottom-grid,
            .responsive-members-grid,
            .responsive-loans-grid,
            .responsive-lower-two {
              grid-template-columns: 1fr !important;
            }

            .responsive-hero {
              grid-template-columns: 1fr !important;
              text-align: center !important;
              direction: rtl !important;
            }

            .responsive-hero-meta,
            .responsive-hero-logo {
              justify-self: center !important;
              align-items: center !important;
            }
          }

          @media (max-width: 760px) {
            .responsive-mini-grid,
            .responsive-insurance-grid,
            .responsive-loan-summary,
            .responsive-kpi-inner,
            .responsive-grid-4 {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <div style={styles.page}>
        <div className="no-print" style={styles.actionsBar}>
          <div className="client-menu-wrap" ref={clientMenuRef}>
            <button
              type="button"
              onClick={() => setIsClientMenuOpen((value) => !value)}
              className="action-button client-hamburger-button"
              aria-label="ניווט תצוגת לקוח"
              title="ניווט תצוגת לקוח"
            >
              <span className="client-hamburger-lines" aria-hidden="true" />
            </button>

            {isClientMenuOpen ? (
              <div className="client-menu-panel">
                <div className="client-menu-title">ניווט תצוגת לקוח</div>
                <div className="client-menu-subtitle">
                  בחר את הדוח שתרצה לפתוח מתוך מסך הלקוח.
                </div>

                <button
                  type="button"
                  className="client-menu-member-row"
                  onClick={handleOpenFamilyClientView}
                  title="פתיחת דוח משפחתי"
                >
                  <span className="client-menu-member-name">דוח משפחתי</span>
                  <span className="client-menu-member-arrow">›</span>
                </button>

                {members.length ? (
                  members.map((member, index) => (
                    <button
                      key={member?.id || member?.name || index}
                      type="button"
                      className="client-menu-member-row"
                      onClick={() => handleOpenMemberReport(member, index)}
                      title={`פתיחת דוח פרט עבור ${member?.name || "ללא שם"}`}
                    >
                      <span className="client-menu-member-name">
                        {member?.name || "ללא שם"}
                      </span>
                      <span className="client-menu-member-arrow">›</span>
                    </button>
                  ))
                ) : (
                  <div className="client-menu-empty">
                    אין בני משפחה להצגה.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button onClick={handleExportPdf} className="action-button primary">
            ייצוא ל־PDF
          </button>

          <button onClick={onResetAll} className="action-button danger">
            איפוס מלא
          </button>

          <div className="client-link-button-wrap">
            <button onClick={handleCreateClientLink} className="action-button accent">
              יצירת לינק ללקוח
            </button>

            {isClientLinkCopied ? (
              <span className="client-link-success-check" title="הלינק הועתק">
                ✓
              </span>
            ) : null}
          </div>

          <button onClick={onBack} className="action-button">
            חזרה למסך העלאה
          </button>
        </div>

        <div style={styles.container}>
          <section
            className="print-section responsive-hero avoid-break"
            style={styles.heroHeader}
          >
            <div className="responsive-hero-logo" style={styles.heroLogoWrap}>
              <ZviranLogo light />
            </div>

            <div style={styles.heroCenter}>
              <div style={styles.heroEyebrow}>מסך ראשי · דוח משפחתי מאוחד</div>
              <h1 style={styles.heroTitle}>דוח פנסיוני משפחתי מאוחד</h1>
              <div style={styles.heroSubtitle}>
                ריכזנו עבורך תמונת מצב משפחתית אחת הכוללת את כלל הנכסים
                הפנסיוניים, תחזית פרישה, פיזור בין מוצרים וגופים מנהלים, חשיפה
                מנייתית, הלוואות, כיסויים ומידע מרכזי לכל אחד מבני המשפחה.
              </div>
            </div>

            <div className="responsive-hero-meta" style={styles.heroMeta}>
              <div style={styles.heroClientLogoBox}>
                {reportData?.clientLogo ? (
                  <img
                    src={reportData.clientLogo}
                    alt="לוגו חברה"
                    style={styles.heroClientLogoImage}
                  />
                ) : (
                  <div style={styles.heroClientLogoPlaceholder}>לוגו חברה</div>
                )}
              </div>

              <div>
                <div style={styles.heroMetaLabel}>תאריך עדכון</div>
                <div style={styles.heroMetaValue}>{family.lastUpdated || "—"}</div>
              </div>
            </div>
          </section>

          <section
            className="print-section responsive-grid-4 avoid-break"
            style={styles.topGrid}
          >
            <KpiCard
              styles={styles}
              icon={<GiftIcon />}
              title="סך נכסים"
              value={formatCurrency(family.totalAssets)}
              subtext="סך הצבירה הכולל של התא המשפחתי"
            />

            <KpiCard
              styles={styles}
              icon={<DepositIcon />}
              title="הפקדה חודשית"
              value={formatCurrency(family.monthlyDeposits)}
              subtext="סך ההפקדות החודשיות של בני המשפחה"
            />

            <DonutSummaryCard
              title="חלוקה לפי מוצרים"
              subtitle="התפלגות הנכסים בין סוגי החיסכון הקיימים בתיק."
              items={products}
              colors={brandChartColors}
              styles={styles}
              formatCurrency={formatCurrency}
            />

            <DonutSummaryCard
              title="חלוקה לפי גופים מנהלים"
              subtitle="התפלגות הניהול בין החברות והגופים המנהלים."
              items={managers}
              colors={brandChartColors}
              styles={styles}
              formatCurrency={formatCurrency}
            />
          </section>

          <section
            className="print-section responsive-grid-2 avoid-break"
            style={styles.compareGrid}
          >
            <ComparisonChartCard
              styles={styles}
              title="צבירה צפויה בגיל פרישה"
              explanation="השוואה בין סכום חד פעמי צפוי עם המשך הפקדות לבין ללא המשך הפקדות."
              bars={retirementLumpBars}
            />

            <ComparisonChartCard
              styles={styles}
              title="קצבה חודשית בגיל פרישה"
              explanation="השוואה בין קצבה צפויה עם המשך הפקדות לבין ללא המשך הפקדות."
              bars={retirementPensionBars}
            />
          </section>

          {hasVestedBalanceTable ? (
            <section
              className="print-section vested-balance-section avoid-break"
              style={styles.sectionCard}
            >
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>📋</span>
                  <h2 style={styles.h2}>צבירה מוכרת לפי תגמולים ופיצויים</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                טבלה זו מוצגת רק כאשר הועלה PDF ייעודי במסך ההעלאה ונמצאו בו
                נתוני צבירה מוכרת.
                {vestedBalanceTable?.sourceFileName
                  ? ` מקור הנתונים: ${vestedBalanceTable.sourceFileName}.`
                  : ""}
              </div>

              <VestedBalanceTable
                table={vestedBalanceTable}
                styles={styles}
              />
            </section>
          ) : null}

          <section
            className="print-section responsive-lower-two"
            style={styles.lowerTwoGrid}
          >
            <section
              className="foreign-exposure-print avoid-break"
              style={styles.sectionCard}
            >
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>🌍</span>
                  <h2 style={styles.h2}>חשיפה לחו"ל</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                התרשים מציג חלוקה משוקללת בין חו"ל לישראל על בסיס נתוני
                Exposures בכלל הנכסים.
              </div>

              <PercentDonutCard
                title={'חשיפה לחו"ל'}
                subtitle={`חשיפה משוקללת לחו"ל: ${formatPercentLabel(
                  weightedForeignExposure
                )}`}
                items={foreignExposureAllocation}
                colors={[accent, gold]}
                styles={styles}
              />
            </section>

            <section className="equity-print avoid-break" style={styles.equityCard}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>📊</span>
                  <h2 style={styles.h2}>חשיפה מנייתית משוקללת</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                המדד מחושב על בסיס משקל המסלולים בתיק ואחוז המניות המשוער בכל
                מסלול.
              </div>

              <div style={styles.equityValueWrap}>
                <div style={styles.equityValue}>
                  {formatPercentLabel(weightedEquityExposure)}
                </div>
                <div style={styles.equityLabel}>{exposureLabel}</div>
              </div>

              <EquityBarModern value={weightedEquityExposure} />
            </section>
          </section>

          <section
            className="print-section main-group-print avoid-break"
            style={styles.sectionCard}
          >
            <DonutBreakdownCard
              title="חלוקה עבור אפיקים ראשיים"
              subtitle="התרשים מציג את חלוקת אפיקי ההשקעה בתיק ביחס לסך הנכסים."
              items={mainGroupAllocation}
              formatCurrency={formatCurrency}
              colors={brandChartColors}
            />
          </section>

          <section
            className="print-section members-section force-new-page-print"
            style={styles.sectionCard}
          >
            <h2 style={styles.h2}>פירוט לפי בני משפחה</h2>
            <div style={styles.explanation}>
              מוצגת תמונת מצב אישית לכל אחד מבני המשפחה, כולל קצבה, סכום חד
              פעמי, ביטוח חיים ואובדן כושר עבודה.
            </div>

            <div className="responsive-members-grid" style={styles.membersGrid}>
              {members.map((member, index) => (
                <div
                  key={member.id || member.name || index}
                  className="member-card-print avoid-break"
                  style={styles.memberCard}
                >
                  <div style={styles.memberTop}>
                    <div>
                      <div style={styles.memberName}>{member.name || "ללא שם"}</div>
                    </div>

                    <div style={styles.chip}>
                      הפקדה חודשית: {formatCurrency(member.monthlyDeposits)}
                    </div>
                  </div>

                  <div style={styles.centerCard}>
                    <div style={styles.centerLabel}>סך צבירה</div>
                    <div style={styles.centerValue}>
                      {formatCurrency(member.assets)}
                    </div>
                  </div>

                  <div
                    className="responsive-mini-grid"
                    style={styles.compareMiniGrid}
                  >
                    <div style={styles.compareMiniCard}>
                      <div style={styles.compareMiniTitle}>קצבה חודשית צפויה</div>
                      <div style={styles.compareMiniInner}>
                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>עם הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.monthlyPensionWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.dividerLine} />

                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>ללא הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.monthlyPensionWithoutDeposits)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={styles.compareMiniCard}>
                      <div style={styles.compareMiniTitle}>סכום חד הוני לפרישה</div>
                      <div style={styles.compareMiniInner}>
                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>עם הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.lumpSumWithDeposits)}
                          </div>
                        </div>

                        <div style={styles.dividerLine} />

                        <div style={styles.compareMiniSide}>
                          <div style={styles.compareMiniSideLabel}>ללא הפקדות</div>
                          <div style={styles.compareMiniSideValue}>
                            {formatCurrency(member.lumpSumWithoutDeposits)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="responsive-insurance-grid"
                    style={styles.insuranceGrid}
                  >
                    <div style={styles.insuranceCard}>
                      <div style={styles.insuranceLabel}>🛡️ ביטוח חיים</div>
                      <div style={styles.insuranceValue}>
                        {formatCurrency(member.deathCoverage)}
                      </div>
                    </div>

                    <div style={styles.insuranceCard}>
                      <div style={styles.insuranceLabel}>🧍 אובדן כושר עבודה</div>
                      <div style={styles.insuranceValue}>
                        {formatCurrency(member.disabilityValue)} (
                        {Math.round(Number(member.disabilityPercent || 0))}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!members.length ? (
                <div style={styles.emptyState}>לא התקבל פירוט בני משפחה להצגה.</div>
              ) : null}
            </div>
          </section>

          <section
            className="print-section loans-section force-new-page-print"
            style={styles.loansBenefitsGrid}
          >
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={styles.titleWithIcon}>
                  <span>💳</span>
                  <h2 style={styles.h2}>הלוואות על חשבון מוצרים פנסיוניים</h2>
                </div>
              </div>

              <div style={styles.explanation}>
                פירוט הלוואות לפי אדם עם סיכום כולל ויחס לנכסים.
              </div>

              {hasDetailedLoans ? (
                <>
                  {Object.entries(groupedLoans).map(([personName, personLoans]) => {
                    const totalAmount = personLoans.reduce(
                      (sum, loan) => sum + (loan.amount || 0),
                      0
                    );
                    const totalBalance = personLoans.reduce(
                      (sum, loan) => sum + (loan.balance || 0),
                      0
                    );

                    return (
                      <div
                        className="print-table-block loan-group-print avoid-break"
                        key={personName}
                        style={styles.loanGroup}
                      >
                        <div style={styles.loanPersonName}>{personName}</div>

                        <div
                          className="responsive-loan-summary"
                          style={styles.loanSummaryRow}
                        >
                          <div style={styles.loanSummaryCard}>
                            <div style={styles.loanSummaryLabel}>
                              סך סכום הלוואות
                            </div>
                            <div style={styles.loanSummaryValue}>
                              {formatCurrency(totalAmount)}
                            </div>
                          </div>

                          <div style={styles.loanSummaryCard}>
                            <div style={styles.loanSummaryLabel}>יתרת הלוואות</div>
                            <div style={styles.loanSummaryValue}>
                              {formatCurrency(totalBalance)}
                            </div>
                          </div>
                        </div>

                        <div
                          className="print-table-block avoid-break"
                          style={styles.loanTableWrap}
                        >
                          <table style={styles.loanTable}>
                            <thead>
                              <tr>
                                <th style={styles.loanTh}>סכום הלוואה</th>
                                <th style={styles.loanTh}>תדירות החזר</th>
                                <th style={styles.loanTh}>יתרת הלוואה</th>
                                <th style={styles.loanTh}>תאריך סיום</th>
                              </tr>
                            </thead>
                            <tbody>
                              {personLoans.map((loan) => (
                                <tr key={loan.id}>
                                  <td style={styles.loanTd}>
                                    {formatCurrency(loan.amount)}
                                  </td>
                                  <td style={styles.loanTd}>
                                    {loan.repaymentFrequency || "—"}
                                  </td>
                                  <td style={styles.loanTd}>
                                    {formatCurrency(loan.balance)}
                                  </td>
                                  <td style={styles.loanTd}>
                                    {formatDate(loan.endDate)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className="print-table-block loan-group-print avoid-break"
                    style={{ ...styles.loanGroup, marginTop: "16px" }}
                  >
                    <div
                      className="responsive-loan-summary"
                      style={styles.loanSummaryRow}
                    >
                      <div style={styles.loanSummaryCard}>
                        <div style={styles.loanSummaryLabel}>סה"כ הלוואות</div>
                        <div style={styles.loanSummaryValue}>
                          {formatCurrency(totalLoansAmount)}
                        </div>
                      </div>

                      <div style={styles.loanSummaryCard}>
                        <div style={styles.loanSummaryLabel}>יחס לנכסים</div>
                        <div style={styles.loanSummaryValue}>
                          {loanRatioToAssets.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : !loans.hasData ? (
                <div style={styles.emptyState}>
                  לא התקבל מידע על הלוואות בשני הקבצים שהועלו.
                </div>
              ) : (
                <div style={styles.emptyState}>
                  התקבל סטטוס הלוואות, אבל לא הגיע פירוט מלא להצגה.
                </div>
              )}
            </section>
          </section>

          <section
            className="summary-box-print avoid-break"
            style={styles.sectionCard}
          >
            <div style={styles.sectionHeader}>
              <div style={styles.titleWithIcon}>
                <span>🧾</span>
                <h2 style={styles.h2}>סיכום מהיר</h2>
              </div>
            </div>

            <div style={styles.summaryStatsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>מוצרים</div>
                <div style={styles.statValue}>{products.length}</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>גופים מנהלים</div>
                <div style={styles.statValue}>{managers.length}</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>בני משפחה</div>
                <div style={styles.statValue}>{members.length}</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>אפיקים ראשיים</div>
                <div style={styles.statValue}>{mainGroupAllocation.length}</div>
              </div>
            </div>

            <div style={styles.simpleInfoBox}>
              <div style={styles.infoLabel}>יחס הלוואות לנכסים</div>
              <div style={styles.infoValue}>{loanRatioToAssets.toFixed(1)}%</div>
            </div>

            <div style={{ ...styles.simpleInfoBox, marginTop: "12px" }}>
              <div style={styles.infoLabel}>קצבה חודשית צפויה</div>
              <div style={styles.infoValue}>
                {formatCurrency(family.monthlyPensionWithDeposits)}
              </div>
            </div>

            <div style={{ ...styles.simpleInfoBox, marginTop: "12px" }}>
              <div style={styles.infoLabel}>צבירה צפויה בגיל פרישה</div>
              <div style={styles.infoValue}>
                {formatCurrency(family.projectedLumpSumWithDeposits)}
              </div>
            </div>
          </section>


          <section
            className="print-section recommendations-section recommendations-print avoid-break"
            style={styles.sectionCard}
          >
            <div style={styles.sectionHeader}>
              <div style={styles.titleWithIcon}>
                <span>📝</span>
                <h2 style={styles.h2}>המלצות</h2>
              </div>
            </div>

            <div style={styles.explanation}>
              כאן אפשר להוסיף תובנות, מסקנות, פעולות מומלצות, נקודות לשיחה עם
              הלקוח, או כל מלל חופשי שתרצה להציג כחלק מהדוח.
            </div>

            <div style={styles.recommendationsWrap}>
              <div className="screen-only">
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  style={styles.recommendationsText}
                  placeholder="כתוב כאן המלצות אישיות..."
                />
              </div>

              <div className="print-only" style={styles.recommendationsPrintText}>
                {recommendations}
              </div>
            </div>
          </section>

          <div style={styles.footer}>
            <div>Zviran · Total Rewards Experts</div>
            <div>דוח זה הופק לצורך הצגה והדפסה מתוך המערכת</div>
          </div>
        </div>
      </div>
    </>
  );
}

function VestedBalanceTable({ table, styles }) {
  const rows = Array.isArray(table?.rows) ? table.rows : [];

  const columns = [
    { key: "fundName", label: "שם הקופה" },
    { key: "balanceFee", label: "% דמי ניהול על הצבירה" },
    { key: "depositFee", label: "% דמי ניהול על ההפקדות" },
    { key: "rewardsUntil2011", label: "תגמולים עד 2011" },
    { key: "rewardsFrom2012", label: "תגמולים מ־2012" },
    { key: "severanceFrom2017", label: "פיצויים מ־2017" },
    { key: "exemptPayments", label: "סכום תשלומים פטורים" },
    { key: "coefficient", label: "מקדם" },
    { key: "pension", label: "קצבה" },
  ];

  const isTotalRow = (row) =>
    String(row?.fundName || "")
      .replace(/[״"]/g, "")
      .includes("סהכ") ||
    String(row?.fundName || "").includes('סה"כ') ||
    String(row?.fundName || "").includes("סה״כ");

  return (
    <div style={styles.vestedTableWrap}>
      <table style={styles.vestedTable}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={styles.vestedTh}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const rowStyle = isTotalRow(row)
              ? styles.vestedTotalTd
              : styles.vestedTd;

            return (
              <tr key={row.id || index}>
                {columns.map((column) => (
                  <td key={column.key} style={rowStyle}>
                    {row[column.key] || "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function KpiCard({ styles, icon, title, value, subtext }) {
  return (
    <div style={styles.kpiCard} className="kpi-card-hover">
      <div
        className="responsive-kpi-inner"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <div style={styles.kpiIconWrap}>{icon}</div>
        <div style={styles.kpiTitle}>{title}</div>
        <div style={styles.kpiValue}>{value}</div>
        <div style={styles.kpiSub}>{subtext}</div>
      </div>
    </div>
  );
}

function ComparisonChartCard({ styles, title, explanation, bars }) {
  return (
    <div style={styles.compareCard}>
      <div style={styles.compareTitle}>{title}</div>
      <div style={styles.compareDesc}>{explanation}</div>

      <div style={styles.compareBarList}>
        {bars.map((bar) => (
          <div key={bar.label} style={styles.compareBarItem}>
            <div style={styles.compareBarTop}>
              <div style={styles.compareBarLabel}>{bar.label}</div>
              <div style={styles.compareBarValue}>{bar.display}</div>
            </div>

            <div style={styles.compareTrack}>
              <div
                style={{
                  ...(bar.tone === "primary"
                    ? styles.compareFillPrimary
                    : styles.compareFillMuted),
                  width: `${Math.max(bar.ratio, 6)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquityBarModern({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div style={{ paddingTop: "6px" }}>
      <div
        style={{
          position: "relative",
          height: "16px",
          borderRadius: "999px",
          background:
            "linear-gradient(270deg, #F9F7F3 0%, #EAF1FB 45%, #E2D1BF 75%, #00215D 100%)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            marginRight: 0,
            marginLeft: "auto",
            width: `${safeValue}%`,
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(270deg, #FF2756 0%, #00215D 100%)",
            boxShadow: "0 1px 3px rgba(0,33,93,0.25)",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          fontSize: "12px",
          color: "#627D98",
          direction: "rtl",
        }}
      >
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function buildDonutSegments(items, colors) {
  const safeItems = Array.isArray(items) ? items : [];
  const cleanItems = safeItems
    .map((item) => ({
      ...item,
      name: item.name || "ללא שם",
      value: Number(item.value || 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = cleanItems.reduce((sum, item) => sum + item.value, 0);
  const safeTotal = total || 1;

  let current = 0;
  const segments = cleanItems.map((item, index) => {
    const percent = (item.value / safeTotal) * 100;
    const start = current;
    const end = current + percent;
    current = end;

    return {
      ...item,
      percent,
      start,
      end,
      color: colors[index % colors.length],
    };
  });

  const gradient = segments.length
    ? segments.map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`).join(", ")
    : "#D7DEE7 0% 100%";

  return { segments, total, gradient };
}

function Donut3D({ gradient, size = 110, hole = "30%", soft = false }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `conic-gradient(${gradient})`,
        position: "relative",
        flexShrink: 0,
        boxShadow: soft
          ? "inset 0 0 0 2px rgba(255,255,255,0.95), inset 0 -7px 10px rgba(0,0,0,0.12), 0 7px 14px rgba(0,33,93,0.10)"
          : "inset 0 0 0 3px rgba(255,255,255,0.95), inset 0 -12px 18px rgba(0,0,0,0.14), 0 10px 22px rgba(0,33,93,0.12)",
        transform: soft
          ? "perspective(700px) rotateX(4deg)"
          : "perspective(900px) rotateX(4deg)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 42%, rgba(0,0,0,0.10) 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: hole,
          background: "#fff",
          borderRadius: "50%",
          boxShadow:
            "inset 0 5px 10px rgba(0,33,93,0.05), 0 0 0 2px rgba(255,255,255,0.9)",
          transform: soft ? "rotateX(-4deg)" : "rotateX(-4deg)",
        }}
      />
    </div>
  );
}

function DonutSummaryCard({
  title,
  subtitle,
  items,
  colors,
  styles,
  formatCurrency,
}) {
  const { segments, gradient } = buildDonutSegments(items, colors);

  return (
    <section style={styles.donutCard}>
      <h3 style={styles.donutTitle}>{title}</h3>
      <div style={{ ...styles.smallText, marginTop: "6px" }}>{subtitle}</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 116px",
          gap: "14px",
          alignItems: "center",
          marginTop: "12px",
          minHeight: "122px",
          direction: "rtl",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            minWidth: 0,
          }}
        >
          {segments.length ? (
            segments.slice(0, 5).map((seg, index) => (
              <div
                key={`${seg.name || "item"}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px 1fr 10px",
                  gap: "8px",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    color: "#102A43",
                    fontWeight: 800,
                    textAlign: "left",
                    direction: "ltr",
                  }}
                >
                  {Math.round(seg.percent)}%
                </div>

                <div style={{ minWidth: 0, textAlign: "right" }}>
                  <div
                    style={{
                      color: "#102A43",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={seg.name}
                  >
                    {seg.name}
                  </div>
                  <div
                    style={{
                      color: "#627D98",
                      fontSize: "11px",
                      marginTop: "2px",
                    }}
                  >
                    {formatCurrency(seg.value)}
                  </div>
                </div>

                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: seg.color,
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(16,42,67,0.15)",
                  }}
                />
              </div>
            ))
          ) : (
            <div style={{ ...styles.smallText, marginTop: "4px" }}>
              אין נתונים להצגה
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Donut3D gradient={gradient} size={104} hole="31%" soft />
        </div>
      </div>
    </section>
  );
}

function DonutBreakdownCard({
  title = "חלוקה עבור אפיקים ראשיים",
  subtitle = "התרשים מציג את חלוקת אפיקי ההשקעה בתיק ביחס לסך הנכסים.",
  items,
  formatCurrency,
  colors,
}) {
  const { segments, total, gradient } = buildDonutSegments(items, colors);

  return (
    <div style={{ width: "100%", direction: "rtl" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: `conic-gradient(${colors[0]} 0 25%, ${colors[1]} 25% 50%, ${colors[2]} 50% 75%, ${colors[3]} 75% 100%)`,
                display: "inline-block",
              }}
            />
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                lineHeight: 1.25,
                color: "#00215D",
                fontWeight: 800,
              }}
            >
              {title}
            </h2>
          </div>

          <div style={{ fontSize: "13px", color: "#627D98", lineHeight: 1.7 }}>
            {subtitle}
          </div>
        </div>
      </div>

      {segments.length ? (
        <div
          className="main-breakdown-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "0.95fr 1.05fr",
            gap: "28px",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            {segments.map((seg, index) => (
              <div
                key={`${seg.id || seg.name}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr 132px 14px",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom:
                    index === segments.length - 1 ? "none" : "1px solid #E8E1D7",
                  minHeight: "44px",
                }}
              >
                <div
                  style={{
                    color: "#102A43",
                    fontWeight: 800,
                    fontSize: "14px",
                    textAlign: "left",
                    direction: "ltr",
                  }}
                >
                  {Math.round(seg.percent)}%
                </div>

                <div
                  style={{
                    color: "#102A43",
                    fontWeight: 800,
                    fontSize: "14px",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={seg.name}
                >
                  {seg.name}
                </div>

                <div
                  style={{
                    color: "#102A43",
                    fontWeight: 700,
                    fontSize: "14px",
                    textAlign: "right",
                    direction: "ltr",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(seg.value)}
                </div>

                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: seg.color,
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(16,42,67,0.15)",
                  }}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div style={{ position: "relative", width: "min(340px, 100%)" }}>
              <div style={{ width: "100%", aspectRatio: "1 / 1", position: "relative" }}>
                <Donut3D gradient={gradient} size={340} hole="27%" />
                <div
                  style={{
                    position: "absolute",
                    inset: "27%",
                    borderRadius: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      color: "#627D98",
                      fontSize: "15px",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    סה"כ נכסים
                  </div>

                  <div
                    style={{
                      color: "#00215D",
                      fontSize: "28px",
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
          </div>
        </div>
      ) : (
        <div
          style={{
            border: "1px dashed #E2D1BF",
            borderRadius: "16px",
            padding: "18px",
            color: "#627D98",
            fontSize: "12px",
            background: "#FCFBF8",
          }}
        >
          אין נתוני אפיקים להצגה
        </div>
      )}
    </div>
  );
}

function PercentDonutCard({ title, subtitle, items, colors, styles }) {
  const safeItems = Array.isArray(items) ? items : [];
  const { segments, gradient } = buildDonutSegments(
    safeItems.map((item) => ({
      ...item,
      value: Number(item.value || item.percent || 0),
    })),
    colors
  );

  return (
    <section
      style={{
        ...styles.donutCard,
        minHeight: "auto",
        boxShadow: "none",
        padding: 0,
        border: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 116px",
          gap: "14px",
          alignItems: "center",
          minHeight: "122px",
          direction: "rtl",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {segments.length ? (
            segments.map((seg, index) => (
              <div
                key={`${seg.name || "item"}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px 1fr 10px",
                  gap: "8px",
                  alignItems: "center",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    color: "#102A43",
                    fontWeight: 800,
                    textAlign: "left",
                    direction: "ltr",
                  }}
                >
                  {Math.round(seg.percent)}%
                </div>

                <div
                  style={{
                    color: "#102A43",
                    fontWeight: 700,
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textAlign: "right",
                  }}
                  title={seg.name}
                >
                  {seg.name}
                </div>

                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: seg.color,
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(16,42,67,0.15)",
                  }}
                />
              </div>
            ))
          ) : (
            <div style={{ ...styles.smallText, marginTop: "4px" }}>
              אין נתונים להצגה
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Donut3D gradient={gradient} size={110} hole="31%" soft />
        </div>
      </div>
    </section>
  );
}

function ZviranLogo({ light = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        direction: "ltr",
        justifyContent: light ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          width: "54px",
          height: "54px",
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
            width: "24px",
            height: "8px",
            background: "#FF2756",
            borderRadius: "999px",
            top: "15px",
            left: "16px",
            transform: "rotate(-35deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "24px",
            height: "8px",
            background: "#ffffff",
            borderRadius: "999px",
            top: "24px",
            left: "12px",
            transform: "rotate(-35deg)",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div
          style={{
            fontSize: "36px",
            fontWeight: 300,
            letterSpacing: "-1px",
            color: light ? "#fff" : "#0A2668",
          }}
        >
          zviran
        </div>
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
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
