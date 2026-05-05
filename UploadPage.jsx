// src/UploadPage.jsx

import React, { useRef, useState } from "react";
import {
  parseMultiplePensionXmlFiles,
  buildLegacyReportData,
} from "./pensionXmlParser";

export default function UploadPage({ setReportData }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [clientLogoFile, setClientLogoFile] = useState(null);
  const [clientLogoPreview, setClientLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState("");

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  const addFiles = (files) => {
    const xmlFiles = Array.from(files || []).filter((file) =>
      file.name.toLowerCase().endsWith(".xml")
    );

    if (!xmlFiles.length) {
      setError("יש לבחור קבצי XML בלבד");
      return;
    }

    setError("");

    setSelectedFiles((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}_${file.size}_${file.lastModified}`)
      );

      const newFiles = xmlFiles.filter((file) => {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        return !existingKeys.has(key);
      });

      return [...prev, ...newFiles];
    });
  };

  const handleFileSelection = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleLogoSelection = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedImageTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];

    if (!allowedImageTypes.includes(file.type)) {
      setLogoError("יש לבחור קובץ תמונה מסוג PNG / JPG / SVG / WEBP");
      event.target.value = "";
      return;
    }

    const maxLogoSizeMb = 3;
    const maxLogoSizeBytes = maxLogoSizeMb * 1024 * 1024;

    if (file.size > maxLogoSizeBytes) {
      setLogoError(`גודל הלוגו חייב להיות עד ${maxLogoSizeMb}MB`);
      event.target.value = "";
      return;
    }

    setLogoError("");
    setClientLogoFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setClientLogoPreview(reader.result);
    };

    reader.onerror = () => {
      setLogoError("לא ניתן היה לקרוא את קובץ הלוגו");
      setClientLogoFile(null);
      setClientLogoPreview(null);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeClientLogo = () => {
    setClientLogoFile(null);
    setClientLogoPreview(null);
    setLogoError("");
  };

  const openLogoPicker = () => {
    logoInputRef.current?.click();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounterRef.current = 0;
    setIsDragging(false);

    addFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";

    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounterRef.current += 1;
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounterRef.current -= 1;

    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragEnd = (event) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounterRef.current = 0;
    setIsDragging(false);
  };

  const removeFile = (fileToRemove) => {
    setSelectedFiles((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setError("");
    dragCounterRef.current = 0;
    setIsDragging(false);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

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

      reportData.clientLogo = clientLogoPreview || null;
      reportData.clientLogoFileName = clientLogoFile?.name || "";

      setReportData(reportData);
    } catch (err) {
      console.error(err);
      setError(`שגיאה בקריאת קבצי XML: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        direction: "rtl",
        background: "#f7f8fc",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 28,
          padding: 32,
          boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
          border: "1px solid #e7ebf3",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              color: "#0d2c6c",
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            העלאת קבצי XML
          </h1>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              color: "#5f6b85",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            אפשר להעלות קבצים אחד-אחד, לבחור כמה יחד, או פשוט לגרור לכאן. המערכת
            תשמור את כל הקבצים שנבחרו עד שתלחץ על “הפק דוח”.
          </p>
        </div>

        <div
          style={{
            background: "#f9fbff",
            border: "1px solid #e4e9f5",
            borderRadius: 24,
            padding: "22px 24px",
            marginBottom: 20,
          }}
        >
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={handleLogoSelection}
            style={{ display: "none" }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 18,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: "#0d2c6c",
                  fontSize: 18,
                  fontWeight: 900,
                  marginBottom: 8,
                }}
              >
                לוגו חברה לדוח (אופציונלי)
              </div>

              <div
                style={{
                  color: "#69758e",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                ניתן להעלות לוגו PNG / JPG / SVG / WEBP. הלוגו יוצג בהמשך
                בראש הדוח, לצד לוגו Zviran.
              </div>

              {clientLogoFile && (
                <div
                  style={{
                    color: "#0d2c6c",
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: 8,
                    wordBreak: "break-word",
                  }}
                >
                  נבחר לוגו: {clientLogoFile.name}
                </div>
              )}

              {logoError && (
                <div
                  style={{
                    color: "#b42318",
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  {logoError}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: 132,
                  height: 76,
                  borderRadius: 18,
                  border: "1px solid #d7deed",
                  background: clientLogoPreview ? "#ffffff" : "#eef2fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  color: "#7b879d",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {clientLogoPreview ? (
                  <img
                    src={clientLogoPreview}
                    alt="תצוגת לוגו"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      padding: 8,
                    }}
                  />
                ) : (
                  "לוגו"
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={openLogoPicker}
                  style={{
                    background: "#ffffff",
                    color: "#0d2c6c",
                    border: "1px solid #cbd4e6",
                    borderRadius: 12,
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    minWidth: 120,
                  }}
                >
                  בחירת לוגו
                </button>

                {clientLogoPreview && (
                  <button
                    type="button"
                    onClick={removeClientLogo}
                    style={{
                      background: "#fff5f5",
                      color: "#c81e1e",
                      border: "1px solid #f3c2c2",
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      minWidth: 120,
                    }}
                  >
                    הסר לוגו
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragEnd}
          style={{
            border: isDragging ? "2px solid #0d2c6c" : "2px dashed #cbd4e6",
            background: isDragging ? "#eef4ff" : "#f9fbff",
            borderRadius: 24,
            padding: "34px 24px",
            textAlign: "center",
            transition: "all 0.2s ease",
            marginBottom: 20,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xml"
            onChange={handleFileSelection}
            style={{ display: "none" }}
          />

          <div style={{ fontSize: 42, marginBottom: 10 }}>📂</div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0d2c6c",
              marginBottom: 10,
            }}
          >
            גרור קבצי XML לכאן
          </div>

          <div
            style={{
              color: "#69758e",
              fontSize: 15,
              marginBottom: 18,
            }}
          >
            או בחר קבצים ידנית מהמחשב
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            style={{
              background: "#0d2c6c",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "12px 20px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            בחירת קבצים
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              color: "#0d2c6c",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            {selectedFiles.length
              ? `נבחרו ${selectedFiles.length} קבצים`
              : "עדיין לא נבחרו קבצים"}
          </div>

          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={clearAllFiles}
              style={{
                background: "#fff",
                color: "#b42318",
                border: "1px solid #f0c7c2",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              נקה הכל
            </button>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e4e9f5",
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}_${file.size}_${file.lastModified}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom:
                    index !== selectedFiles.length - 1
                      ? "1px solid #eef2fa"
                      : "none",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#0d2c6c",
                      marginBottom: 4,
                      wordBreak: "break-word",
                    }}
                  >
                    {file.name}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                    }}
                  >
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  style={{
                    background: "#fff5f5",
                    color: "#c81e1e",
                    border: "1px solid #f3c2c2",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  הסר
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAnalyzeFiles}
          disabled={loading || selectedFiles.length === 0}
          style={{
            width: "100%",
            padding: "16px 20px",
            background:
              loading || selectedFiles.length === 0 ? "#c3cbdd" : "#0d2c6c",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 800,
            cursor:
              loading || selectedFiles.length === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "מנתח קבצים..." : "הפק דוח"}
        </button>

        {loading && (
          <div
            style={{
              marginTop: 16,
              background: "#eef4ff",
              border: "1px solid #d7e3ff",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 10,
                width: "100%",
                background:
                  "linear-gradient(90deg, #0d2c6c 0%, #3f67c6 50%, #0d2c6c 100%)",
                backgroundSize: "200% 100%",
                animation: "loadingBar 1.4s linear infinite",
              }}
            />
            <div
              style={{
                padding: 12,
                color: "#0d2c6c",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              הקבצים נטענים ומנותחים...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              background: "#fff5f5",
              color: "#b42318",
              border: "1px solid #f3c2c2",
              borderRadius: 14,
              padding: 14,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes loadingBar {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          @media (max-width: 760px) {
            div[style*="grid-template-columns: 1fr auto"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}
