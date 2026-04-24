import { useEffect, useState } from "react";
import UploadPage from "./UploadPage";
import ReportPage from "./ReportPage";
import ClientDashboardPage from "./ClientDashboardPage";

function App() {
  const [currentPage, setCurrentPage] = useState("upload");
  const [reportData, setReportData] = useState(null);
  const [shareError, setShareError] = useState("");
  const [isSharedMode, setIsSharedMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get("share");

    if (!shareToken) return;

    const saved = localStorage.getItem(`clientShare_${shareToken}`);

    if (!saved) {
      setShareError("הקישור לא נמצא בדפדפן זה או שפג תוקפו.");
      setCurrentPage("share-error");
      setIsSharedMode(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setReportData(parsed.reportData);
      setCurrentPage("client");
      setIsSharedMode(true);
    } catch (err) {
      setShareError("הקישור קיים אך הנתונים אינם תקינים.");
      setCurrentPage("share-error");
      setIsSharedMode(true);
    }
  }, []);

  const handleSetReportData = (data) => {
    setReportData(data);
    setCurrentPage("report");
  };

  const createClientShareLink = () => {
    if (!reportData) return "";

    const token =
      "share_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);

    localStorage.setItem(
      `clientShare_${token}`,
      JSON.stringify({
        createdAt: new Date().toISOString(),
        reportData,
      })
    );

    const url = `${window.location.origin}${window.location.pathname}?share=${token}`;
    return url;
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
            maxWidth: 520,
            textAlign: "center",
          }}
        >
          <h1 style={{ color: "#00215D", marginTop: 0 }}>הקישור לא זמין</h1>
          <p style={{ color: "#627D98", lineHeight: 1.8 }}>{shareError}</p>
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
        onCreateShareLink={createClientShareLink}
        isSharedMode={isSharedMode}
      />
    );
  }

  return null;
}

export default App;
