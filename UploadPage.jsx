import React, { useRef, useState } from "react";
import {
  parseMultiplePensionXmlFiles,
  buildLegacyReportData,
} from "./pensionXmlParser";

export default function UploadPage({ setReportData }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // ===============================
  // לוגו
  // ===============================
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("יש להעלות קובץ תמונה בלבד (PNG / JPG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoFile(file);
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ===============================
  // XML
  // ===============================
  const addFiles = (files) => {
    const xmlFiles = Array.from(files || []).filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    );

    if (!xmlFiles.length) {
      setError("יש לבחור קבצי XML בלבד");
      return;
    }

    setError("");
    setSelectedFiles((prev) => [...prev, ...xmlFiles]);
  };

  const handleFileSelection = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  // ===============================
  // הפקת דוח
  // ===============================
  const handleAnalyzeFiles = async () => {
    try {
      setError("");

      if (!selectedFiles.length) {
        setError("יש לבחור לפחות קובץ XML אחד");
        return;
      }

      setLoading(true);

      const parsedFiles = await parseMultiplePensionXmlFiles(selectedFiles);
      const reportData = buildLegacyReportData(parsedFiles);

      // 🔥 הכנסת לוגו לדוח
      reportData.clientLogo = logoPreview || null;

      setReportData(reportData);
    } catch (err) {
      setError(`שגיאה: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, direction: "rtl" }}>
      <h1>העלאת קבצי XML</h1>

      {/* ================= לוגו ================= */}
      <div style={{ marginBottom: 30 }}>
        <h3>לוגו חברה (אופציונלי)</h3>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
        />

        {logoPreview && (
          <div style={{ marginTop: 10 }}>
            <img
              src={logoPreview}
              alt="logo"
              style={{
                height: 60,
                objectFit: "contain",
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 6,
              }}
            />
          </div>
        )}
      </div>

      {/* ================= XML ================= */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xml"
        onChange={handleFileSelection}
      />

      <div style={{ marginTop: 20 }}>
        נבחרו {selectedFiles.length} קבצים
      </div>

      <button
        onClick={handleAnalyzeFiles}
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        {loading ? "מעבד..." : "הפק דוח"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: 20 }}>{error}</div>
      )}
    </div>
  );
}
