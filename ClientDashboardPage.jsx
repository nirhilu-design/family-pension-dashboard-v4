import { useMemo, useState } from "react";
import ClientFamilyView from "./ClientFamilyView";
import ClientMemberView from "./ClientMemberView";
import { buildClientFamilyDataModel } from "./clientDataModel";
import { formatShareDate, isShareExpired } from "./shareStorage";

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
      ? "מבט משפחתי"
      : selectedMember?.name || "מבט אישי";

  const handleChangeView = (viewId) => {
    setActiveView(viewId);
    setMenuOpen(false);
  };

  const handleCreateLink = async () => {
    const result = onCreateShareLink?.();

    if (!result?.success) {
      setCopyStatus(result?.error || "לא ניתן ליצור קישור כרגע");
      return;
    }

    setShareLink(result.url);
    setLocalShareDetails(result.payload || result);

    try {
      await navigator.clipboard.writeText(result.url);
      setCopyStatus("הקישור נוצר והועתק");
    } catch {
      setCopyStatus("הקישור נוצר, ניתן להעתיק ידנית");
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
            .client-desktop-tabs {
              display: none !important;
            }

            .client-mobile-menu {
              display: block !important;
            }

            .client-top-layout {
              align-items: stretch !important;
            }

            .client-actions {
              width: 100% !important;
              justify-content: stretch !important;
            }

            .client-actions button {
              flex: 1 !important;
            }
          }

          @media (min-width: 901px) {
            .client-mobile-menu {
              display: none !important;
            }
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
        <div className="client-no-print" style={topShell}>
          <div className="client-top-layout" style={topBar}>
            <div>
              <div style={eyebrow}>
                {isSharedMode ? "תצוגת לקוח משותפת" : "תצוגת לקוח פנימית"}
              </div>

              <h1 style={topTitle}>דשבורד פנסיוני משפחתי</h1>

              <div style={topSubtitle}>
                מעבר בין תמונה משפחתית מאוחדת לבין פירוט אישי לפי לקוח.
              </div>
            </div>

            <div className="client-actions" style={actions}>
              <button onClick={handleExportPdf} style={pdfButtonStyle}>
                הורד PDF
              </button>

              {!isSharedMode && (
                <button onClick={onBack} style={secondaryButtonStyle}>
                  חזרה לדוח
                </button>
              )}
            </div>
          </div>

          <div style={navArea}>
            <div className="client-desktop-tabs" style={tabs}>
              <button
                onClick={() => handleChangeView("family")}
                style={tabButtonStyle(activeView === "family")}
                title="מבט משפחתי"
              >
                <span style={tabIcon}>👨‍👩‍👧‍👦</span>
                <span>משפחתי</span>
              </button>

              {members.map((member, index) => (
                <button
                  key={member.id}
                  onClick={() => handleChangeView(member.id)}
                  style={tabButtonStyle(activeView === member.id)}
                  title={member.name}
                >
                  <span style={tabIcon}>👤</span>
                  <span>{member.name || `לקוח ${index + 1}`}</span>
                </button>
              ))}
            </div>

            <div className="client-mobile-menu" style={mobileMenuWrap}>
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
          </div>

          {!isSharedMode && (
            <div style={sharePanel}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={sharePanelTitle}>יצירת קישור ללקוח</div>
                <div style={sharePanelText}>
                  הקישור הנוכחי נשמר מקומית בדפדפן לצורך בדיקות. במחשב או נייד
                  אחר הוא לא יעבוד עד שנחבר אחסון ענן מאובטח.
                </div>
              </div>

              <div style={shareActions}>
                <button onClick={handleCreateLink} style={shareButtonStyle}>
                  צור קישור זמני
                </button>

                {copyStatus && (
                  <div
                    style={{
                      color: copyStatus.includes("לא") ? "#B42318" : "#2F7D46",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    {copyStatus}
                  </div>
                )}
              </div>

              {shareLink && (
                <textarea
                  readOnly
                  value={shareLink}
                  style={shareTextArea}
                />
              )}
            </div>
          )}

          {activeShareDetails && (
            <div style={shareInfoBar}>
              <InfoPill
                label="שם"
                value={activeShareDetails.clientName || "לקוח ללא שם"}
              />
              <InfoPill
                label="נוצר"
                value={formatShareDate(activeShareDetails.createdAt)}
              />
              <InfoPill
                label="תוקף עד"
                value={formatShareDate(activeShareDetails.expiresAt)}
              />
              <div
                style={{
                  ...statusPill,
                  background: expired ? "#FFF5F5" : "#EEF8F0",
                  color: expired ? "#B42318" : "#2F7D46",
                }}
              >
                {expired ? "פג תוקף" : "קישור פעיל"}
              </div>
            </div>
          )}
        </div>

        <main
          className="client-print-main"
          style={{
            height: "calc(100vh - 0px)",
            overflowY: "auto",
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

                <button onClick={handleExportPdf} style={topPdfButtonStyle}>
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

function InfoPill({ label, value }) {
  return (
    <div style={infoPill}>
      <span style={{ color: "#627D98" }}>{label}</span>
      <span style={{ color: "#00215D", fontWeight: 800 }}>{value}</span>
    </div>
  );
}

const topShell = {
  background: "#ffffff",
  borderBottom: "1px solid #DCCDBA",
  padding: "18px 24px",
  position: "sticky",
  top: 0,
  zIndex: 20,
  boxShadow: "0 8px 24px rgba(16,42,67,0.06)",
};

const topBar = {
  maxWidth: "1240px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const eyebrow = {
  color: "#627D98",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};

const topTitle = {
  margin: 0,
  color: "#00215D",
  fontSize: 26,
  lineHeight: 1.2,
};

const topSubtitle = {
  marginTop: 8,
  color: "#627D98",
  fontSize: 14,
  lineHeight: 1.6,
};

const actions = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const navArea = {
  maxWidth: "1240px",
  margin: "16px auto 0",
};

const tabs = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const tabButtonStyle = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 999,
  border: active ? "1px solid #4F66E8" : "1px solid #D9DDE8",
  background: active ? "#4F66E8" : "#ffffff",
  color: active ? "#ffffff" : "#102A43",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: active ? "0 8px 18px rgba(79,102,232,0.18)" : "none",
});

const tabIcon = {
  fontSize: 16,
  lineHeight: 1,
};

const mobileMenuWrap = {
  position: "relative",
};

const mobileMenuButton = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "13px 16px",
  borderRadius: 14,
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
  zIndex: 30,
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

const pdfButtonStyle = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #00215D",
  background: "#00215D",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
};

const topPdfButtonStyle = {
  padding: "11px 16px",
  borderRadius: "12px",
  border: "1px solid #00215D",
  background: "#00215D",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "13px",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #D9DDE8",
  background: "#ffffff",
  color: "#102A43",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
};

const sharePanel = {
  maxWidth: "1240px",
  margin: "16px auto 0",
  padding: 14,
  borderRadius: 16,
  background: "#F7F8FC",
  border: "1px solid #D9DDE8",
  display: "flex",
  gap: 14,
  alignItems: "center",
  flexWrap: "wrap",
};

const sharePanelTitle = {
  color: "#00215D",
  fontWeight: 900,
  fontSize: 14,
  marginBottom: 4,
};

const sharePanelText = {
  color: "#627D98",
  fontSize: 12,
  lineHeight: 1.6,
};

const shareActions = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const shareButtonStyle = {
  padding: "13px 16px",
  borderRadius: "12px",
  border: "1px solid #4F66E8",
  background: "#4F66E8",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "14px",
  cursor: "pointer",
};

const shareTextArea = {
  width: "100%",
  minHeight: 74,
  borderRadius: 12,
  border: "1px solid #D9DDE8",
  padding: 10,
  fontSize: 12,
  direction: "ltr",
  resize: "vertical",
  boxSizing: "border-box",
};

const shareInfoBar = {
  maxWidth: "1240px",
  margin: "12px auto 0",
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const infoPill = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  background: "#FCFBF8",
  border: "1px solid #EEE4D8",
  borderRadius: 999,
  fontSize: 12,
};

const statusPill = {
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
};

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
