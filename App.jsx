import { useEffect, useState } from "react";
import UploadPage from "./UploadPage";
import ReportPage from "./ReportPage";
import ClientDashboardPage from "./ClientDashboardPage";
import {
  buildShareUrl,
  createClientShare,
  getShareModeFromUrl,
  loadClientShare,
} from "./shareStorage";

function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            width: 210mm;
            min-height: 297mm;
            direction: rtl;
            background: #ffffff !important;
            font-family: Calibri, Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            zoom: 0.78;
          }

          * {
            box-sizing: border-box;
          }

          /* לא להדפיס כפתורים/פקדים */
          button,
          input,
          select,
          textarea,
          .no-print,
          .print-hide {
            display: none !important;
          }

          /* מניעת חיתוך ריבועים/כרטיסים */
          .card,
          .box,
          .section,
          .report-block,
          .summary-card,
          .member-card,
          .chart-card,
          .table-card,
          .dashboard-card,
          .family-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* מניעת חיתוך טבלאות/גרפים */
          table,
          thead,
          tbody,
          tr,
          td,
          th,
          img,
          svg,
          canvas {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* אם יש אזורים שאתה רוצה שיתחילו בעמוד חדש */
          .print-page {
            page-break-after: always !important;
            break-after: page !important;
          }

          .print-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* שלא יהיה רוחב גדול מדי */
          main,
          section,
          article,
          .container,
          .dashboard,
          .report-container,
          .client-dashboard,
          .client-dashboard-page {
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
          }

          /* ביטול גלילות פנימיות בהדפסה */
          div {
            overflow: visible !important;
          }

          /* ריווח עדין בין בלוקים */
          .report-block,
          .section,
          .card,
          .member-card,
          .dashboard-card {
            margin-bottom: 10px !important;
          }

          /* הורדת צללים כדי שלא יעמיס על PDF */
          .card,
          .box,
          .section,
          .report-block,
          .summary-card,
          .member-card,
          .chart-card,
          .table-card,
          .dashboard-card,
          .family-card {
            box-shadow: none !important;
          }

          /* שמירה על צבעים בהדפסה */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}
    </style>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("upload");
  const [reportData, setReportData] = useState(null);
  const [shareError, setShareError] = useState("");
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [sharePayload, setSharePayload] = useState(null);

  useEffect(() => {
    const shareToken = getShareModeFromUrl();

    if (!shareToken) return;

    const result = loadClientShare(shareToken);

    setIsSharedMode(true);

    if (!result.success) {
      setShareError(result.error);
      setSharePayload(result.payload || null);
      setCurrentPage("share-error");
      return;
    }

    setReportData(result.reportData);
    setSharePayload(result.payload || null);
    setCurrentPage("client");
  }, []);

  const handleSetReportData = (data) => {
    setReportData(data);
    setCurrentPage("report");
  };

  const handleCreateShareLink = (options = {}) => {
    if (!reportData) return null;

    const result = createClientShare(reportData, {
      expirationHours: options.expirationHours || 24,
    });

    if (!result.success) {
      console.error(result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      url: buildShareUrl(result.token),
      token: result.token,
      clientName: result.clientName,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
      payload: result.payload,
    };
  };

  if (currentPage === "share-error") {
    return (
      <>
        <PrintStyles />

        <div
          style={{
            minHeight: "100vh",
            direction: "rtl",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F7F5F1",
            fontFamily: 'Calibri, "Arial", sans-serif',
            padding: 24,
          }}
        >
          <div
            className="report-block"
            style={{
              background: "#fff",
              border: "1px solid #DCCDBA",
              borderRadius: 22,
              padding: 28,
              maxWidth: 560,
              textAlign: "center",
            }}
          >
            <h1 style={{ color: "#00215D", marginTop: 0 }}>הקישור לא זמין</h1>

            <p style={{ color: "#627D98", lineHeight: 1.8 }}>{shareError}</p>

            <p style={{ color: "#627D98", lineHeight: 1.8, fontSize: 13 }}>
              בשלב הנוכחי הקישור נשמר מקומית בדפדפן שבו הוא נוצר. זהו שלב בדיקות
              בלבד לפני מעבר לאחסון ענן מאובטח.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (currentPage === "upload") {
    return (
      <>
        <PrintStyles />
        <UploadPage setReportData={handleSetReportData} />
      </>
    );
  }

  if (currentPage === "report") {
    return (
      <>
        <PrintStyles />

        <ReportPage
          reportData={reportData}
          onBack={() => setCurrentPage("upload")}
          onResetAll={() => {
            setReportData(null);
            setSharePayload(null);
            setIsSharedMode(false);
            setCurrentPage("upload");
          }}
          onOpenClientDashboard={() => setCurrentPage("client")}
        />
      </>
    );
  }

  if (currentPage === "client") {
    return (
      <>
        <PrintStyles />

        <ClientDashboardPage
          reportData={reportData}
          onBack={() => setCurrentPage("report")}
          onCreateShareLink={handleCreateShareLink}
          isSharedMode={isSharedMode}
          sharePayload={sharePayload}
        />
      </>
    );
  }

  return (
    <>
      <PrintStyles />
    </>
  );
}

export default App;
