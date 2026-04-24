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

  const handleCreateShareLink = () => {
    if (!reportData) return null;

    const result = createClientShare(reportData);

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
    );
  }

  if (currentPage === "upload") {
    return <UploadPage setReportData={handleSetReportData} />;
  }

  if (currentPage === "report") {
    return (
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
    );
  }

  if (currentPage === "client") {
    return (
      <ClientDashboardPage
        reportData={reportData}
        onBack={() => setCurrentPage("report")}
        onCreateShareLink={handleCreateShareLink}
        isSharedMode={isSharedMode}
        sharePayload={sharePayload}
      />
    );
  }

  return null;
}

export default App;
