import { useState } from "react";
import UploadPage from "./UploadPage";
import ReportPage from "./ReportPage";
import ClientDashboardPage from "./ClientDashboardPage";

function App() {
  const [currentPage, setCurrentPage] = useState("upload");
  const [reportData, setReportData] = useState(null);

  if (currentPage === "upload") {
    return (
      <UploadPage
        onDataReady={(data) => {
          setReportData(data);
          setCurrentPage("report");
        }}
      />
    );
  }

  if (currentPage === "report") {
    return (
      <ReportPage
        reportData={reportData}
        onBack={() => setCurrentPage("upload")}
        onOpenClientDashboard={() => setCurrentPage("client")}
      />
    );
  }

  if (currentPage === "client") {
    return (
      <ClientDashboardPage
        reportData={reportData}
        onBack={() => setCurrentPage("report")}
      />
    );
  }

  return null;
}

export default App;
