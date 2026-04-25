import { useMemo, useState } from "react";
import ClientFamilyView from "./ClientFamilyView";
import ClientMemberView from "./ClientMemberView";
import { buildClientFamilyDataModel } from "./clientDataModel";
import { formatShareDate, isShareExpired } from "./shareStorage";

const EXPIRATION_OPTIONS = [
  { label: "יום", hours: 24 },
  { label: "3 ימים", hours: 72 },
  { label: "שבוע", hours: 168 },
  { label: "חודש", hours: 720 },
];

function ClientDashboardPage({
  reportData,
  onBack,
  onCreateShareLink,
  isSharedMode = false,
  sharePayload = null,
}) {
  const clientModel = useMemo(
    () => buildClientFamilyDataModel(reportData),
    [reportData]
  );

  const [activeView, setActiveView] = useState("family");
  const [shareLink, setShareLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [localShareDetails, setLocalShareDetails] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);

  if (!reportData) {
    return <div style={{ padding: "40px", direction: "rtl" }}>אין נתונים</div>;
  }

  const members = clientModel.members || [];

  const selectedMember =
    activeView === "family"
      ? null
      : members.find((member) => member.id === activeView);

  const activeShareDetails = sharePayload || localShareDetails;
  const expired = activeShareDetails?.expiresAt
    ? isShareExpired(activeShareDetails.expiresAt)
    : false;

  const activeLabel =
    activeView === "family"
      ? "משפחתי"
      : selectedMember?.name || "מבט אישי";

  const selectedExpirationLabel =
    EXPIRATION_OPTIONS.find((item) => item.hours === Number(expirationHours))
      ?.label || "יום";

  const handleChangeView = (viewId) => {
    setActiveView(viewId);
    setMenuOpen(false);
  };

  const handleCreateLink = async () => {
    const result = onCreateShareLink?.({
      expirationHours: Number(expirationHours),
    });

    if (!result?.success) {
      setCopyStatus(result?.error || "לא ניתן ליצור קישור כרגע");
      return;
    }

    setShareLink(result.url);
    setLocalShareDetails(result.payload || result);

    try {
      await navigator.clipboard.writeText(result.url);
      setCopyStatus(`הקישור נוצר והועתק · תוקף: ${selectedExpirationLabel}`);
    } catch {
      setCopyStatus(`הקישור נוצר · תוקף: ${selectedExpirationLabel}`);
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            .client-no-print {
              display: none !important;
            }

            .client-print-main {
              height: auto !important;
              overflow: visible !important;
              padding: 0 !important;
            }

            .client-print-page {
              display: block !important;
              min-height: auto !important;
              overflow: visible !important;
              background: white !important;
            }

            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }
          }

          @media (max-width: 900px) {
            .desktop-tabs {
              display: none !important;
            }

            .mobile-view-select {
              display: block !important;
            }

            .thin-bar-inner {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .thin-actions {
              justify-content: stretch !important;
            }

            .thin-actions button,
            .thin-actions select {
              flex: 1 !important;
            }
          }

          @media (min-width: 901px) {
            .mobile-view-select {
              display: none !important;
            }
          }

          .client-action-button {
            padding: 10px 14px;
            min-height: 42px;
            border-radius: 12px;
            border: 1px solid #D9DDE8;
            background: #ffffff;
            color: #102A43;
            font-weight: 800;
            font-family: Calibri, Arial, sans-serif;
            font-size: 14px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.18s ease;
          }

          .client-action-button:hover {
            border-color: #4F66E8;
            color: #4F66E8;
          }

          .client-action-button:active {
            background: #4F66E8;
            border-color: #4F66E8;
            color: #ffffff;
          }

          .client-action-button.primary {
            border-color: #00215D;
            background: #00215D;
            color: #ffffff;
          }

          .client-action-button.primary:hover {
            border-color: #4F66E8;
            background: #4F66E8;
            color: #ffffff;
          }

          .client-action-button.primary:active {
            background: #4F66E8;
            border-color: #4F66E8;
            color: #ffffff;
          }

          .client-action-button.accent {
            border-color: #4F66E8;
            background: #4F66E8;
            color: #ffffff;
          }

          .client-action-button.accent:hover {
            border-color: #00215D;
            background: #00215D;
            color: #ffffff;
          }

          .client-select {
            padding: 10px 14px;
            min-height: 42px;
            border-radius: 12px;
            border: 1px solid #D9DDE8;
            background: #ffffff;
            color: #102A43;
            font-weight: 800;
            font-family: Calibri, Arial, sans-serif;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.18s ease;
          }

          .client-select:hover {
            border-color: #4F66E8;
            color: #4F66E8;
          }

          .client-select:focus {
            outline: 2px solid rgba(79, 102, 232, 0.18);
            border-color: #4F66E8;
          }
        `}
      </style>

      <div
        className="client-print-page"
        style={{
          minHeight: "100vh",
          direction: "rtl",
          fontFamily: 'Calibri, "Arial", sans-serif',
          background: "#F7F5F1",
          color: "#102A43",
        }}
      >
        <div className="client-no-print" style={thinStickyBar}>
          <div className="thin-bar-inner" style={thinBarInner}>
            <div className="desktop-tabs" style={tabs}>
              <button
                onClick={() => handleChangeView("family")}
                style={tabButtonStyle(activeView === "family")}
                title="מבט משפחתי"
              >
                👨‍👩‍👧‍👦 משפחתי
              </button>

              {members.map((member, index) => (
                <button
                  key={member.id}
                  onClick={() => handleChangeView(member.id)}
                  style={tabButtonStyle(activeView === member.id)}
                  title={member.name}
                >
                  👤 {member.name || `לקוח ${index + 1}`}
                </button>
              ))}
            </div>

            <div className="mobile-view-select" style={mobileMenuWrap}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={mobileMenuButton}
              >
                <span>☰</span>
                <span>{activeLabel}</span>
                <span>{menuOpen ? "▲" : "▼"}</span>
              </button>

              {menuOpen && (
                <div style={dropdown}>
                  <button
                    onClick={() => handleChangeView("family")}
                    style={dropdownItem(activeView === "family")}
                  >
                    👨‍👩‍👧‍👦 משפחתי
                  </button>

                  {members.map((member, index) => (
                    <button
                      key={member.id}
                      onClick={() => handleChangeView(member.id)}
                      style={dropdownItem(activeView === member.id)}
                    >
                      👤 {member.name || `לקוח ${index + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="thin-actions" style={thinActions}>
              <button
                onClick={handleExportPdf}
                className="client-action-button primary"
              >
                הורד PDF
              </button>

              {!isSharedMode && (
                <select
                  className="client-select"
                  value={expirationHours}
                  onChange={(event) =>
                    setExpirationHours(Number(event.target.value))
                  }
                  title="משך תוקף הקישור"
                >
                  {EXPIRATION_OPTIONS.map((option) => (
                    <option key={option.hours} value={option.hours}>
                      תוקף: {option.label}
                    </option>
                  ))}
                </select>
              )}

              {!isSharedMode && (
                <button
                  onClick={handleCreateLink}
                  className="client-action-button accent"
                >
                  צור קישור
                </button>
              )}

              {!isSharedMode && (
                <button onClick={onBack} className="client-action-button">
                  חזרה לדוח
                </button>
              )}
            </div>
          </div>

          {(copyStatus || shareLink || activeShareDetails) && (
            <div style={thinInfoRow}>
              {copyStatus && (
                <span
                  style={{
                    color: copyStatus.includes("לא") ? "#B42318" : "#2F7D46",
                    fontWeight: 800,
                  }}
                >
                  {copyStatus}
                </span>
              )}

              {activeShareDetails && (
                <>
                  <InfoMini
                    label="שם"
                    value={activeShareDetails.clientName || "לקוח ללא שם"}
                  />
                  <InfoMini
                    label="נוצר"
                    value={formatShareDate(activeShareDetails.createdAt)}
                  />
                  <InfoMini
                    label="תוקף"
                    value={formatShareDate(activeShareDetails.expiresAt)}
                  />
                  <span
                    style={{
                      ...miniStatus,
                      background: expired ? "#FFF5F5" : "#EEF8F0",
                      color: expired ? "#B42318" : "#2F7D46",
                    }}
                  >
                    {expired ? "פג תוקף" : "פעיל"}
                  </span>
                </>
              )}

              {shareLink && (
                <input
                  readOnly
                  value={shareLink}
                  style={shareInput}
                  onFocus={(event) => event.target.select()}
                />
              )}
            </div>
          )}
        </div>

        <main
          className="client-print-main"
          style={{
            overflowX: "hidden",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "1240px",
              minWidth: 0,
              margin: "0 auto",
            }}
          >
            {isSharedMode && (
              <div className="client-no-print" style={sharedNotice}>
                <div>
                  <div style={{ color: "#00215D", fontWeight: 800, fontSize: 16 }}>
                    {activeShareDetails?.clientName || "תצוגת לקוח"}
                  </div>
                  <div style={{ color: "#627D98", fontSize: 13, marginTop: 4 }}>
                    ניתן לשמור את המסך כ־PDF דרך הכפתור העליון.
                  </div>
                </div>

                <button
                  onClick={handleExportPdf}
                  className="client-action-button primary"
                >
                  הורד PDF
                </button>
              </div>
            )}

            {activeView === "family" ? (
              <ClientFamilyView clientModel={clientModel} />
            ) : (
              <ClientMemberView member={selectedMember} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function InfoMini({ label, value }) {
  return (
    <span style={infoMini}>
      <span style={{ color: "#627D98" }}>{label}:</span>
      <span style={{ color: "#00215D", fontWeight: 800 }}>{value}</span>
    </span>
  );
}

const thinStickyBar = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid #DCCDBA",
  boxShadow: "0 4px 16px rgba(16,42,67,0.06)",
  padding: "10px 18px",
};

const thinBarInner = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
};

const tabs = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const tabButtonStyle = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "10px 14px",
  minHeight: 42,
  borderRadius: 12,
  border: active ? "1px solid #4F66E8" : "1px solid #D9DDE8",
  background: active ? "#4F66E8" : "#ffffff",
  color: active ? "#ffffff" : "#102A43",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: active ? "0 6px 14px rgba(79,102,232,0.16)" : "none",
  whiteSpace: "nowrap",
  transition: "all 0.18s ease",
});

const thinActions = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const thinInfoRow = {
  maxWidth: "1240px",
  margin: "8px auto 0",
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  fontSize: 12,
};

const infoMini = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 10px",
  borderRadius: 999,
  background: "#FCFBF8",
  border: "1px solid #EEE4D8",
};

const miniStatus = {
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
};

const shareInput = {
  flex: "1 1 320px",
  minWidth: 260,
  borderRadius: 10,
  border: "1px solid #D9DDE8",
  padding: "8px 10px",
  fontSize: 12,
  direction: "ltr",
  boxSizing: "border-box",
};

const mobileMenuWrap = {
  position: "relative",
  width: "100%",
};

const mobileMenuButton = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "11px 14px",
  borderRadius: 12,
  border: "1px solid #D9DDE8",
  background: "#ffffff",
  color: "#00215D",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};

const dropdown = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  left: 0,
  background: "#ffffff",
  border: "1px solid #D9DDE8",
  borderRadius: 14,
  boxShadow: "0 14px 34px rgba(16,42,67,0.14)",
  padding: 8,
  zIndex: 100,
};

const dropdownItem = (active) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: active ? "#EEF1FF" : "#ffffff",
  color: active ? "#4F66E8" : "#102A43",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  textAlign: "right",
});

const sharedNotice = {
  background: "#ffffff",
  border: "1px solid #DCCDBA",
  borderRadius: 18,
  padding: "14px 18px",
  marginBottom: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

export default ClientDashboardPage;
