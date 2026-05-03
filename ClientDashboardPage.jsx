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
  buttonBorder: "#D9DDE8",
};

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
          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            font-family: Calibri, Arial, sans-serif;
            font-size: 12px;
          }

          .client-action-button {
            padding: 12px 18px;
            min-height: 42px;
            border-radius: 12px;
            border: 1px solid ${theme.buttonBorder};
            background: #ffffff;
            color: ${theme.text};
            font-weight: 800;
            font-family: Calibri, Arial, sans-serif;
            font-size: 12px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.18s ease;
            min-width: 128px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .client-action-button:hover {
            border-color: ${theme.navy};
            color: ${theme.navy};
            transform: translateY(-1px);
          }

          .client-action-button.primary {
            border-color: ${theme.navy};
            background: ${theme.navy};
            color: #ffffff;
            box-shadow: 0 6px 14px rgba(0,33,93,0.16);
          }

          .client-action-button.primary:hover {
            border-color: ${theme.navyDark};
            background: ${theme.navyDark};
            color: #ffffff;
          }

          .client-action-button.accent {
            border-color: ${theme.accent};
            background: ${theme.accent};
            color: #ffffff;
            box-shadow: 0 6px 14px rgba(255,39,86,0.16);
          }

          .client-action-button.accent:hover {
            border-color: #e61f4d;
            background: #e61f4d;
            color: #ffffff;
          }

          .client-select {
            padding: 12px 18px;
            min-height: 42px;
            border-radius: 12px;
            border: 1px solid ${theme.buttonBorder};
            background: #ffffff;
            color: ${theme.text};
            font-weight: 800;
            font-family: Calibri, Arial, sans-serif;
            font-size: 12px;
            cursor: pointer;
            min-width: 132px;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 7mm;
            }

            html,
            body {
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: visible !important;
              direction: rtl !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              zoom: 0.74;
            }

            .client-no-print,
            button,
            input,
            select,
            textarea {
              display: none !important;
            }

            .client-print-page {
              min-height: auto !important;
              background: #ffffff !important;
              overflow: visible !important;
              direction: rtl !important;
            }

            .client-print-main {
              width: 100% !important;
              max-width: none !important;
              height: auto !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
            }

            .client-print-container {
              width: 196mm !important;
              max-width: 196mm !important;
              min-width: 0 !important;
              margin: 0 auto !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            .client-print-container > * {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              overflow: visible !important;
            }

            .client-print-container > * > * {
              max-width: 100% !important;
            }

            section,
            article,
            main,
            div {
              max-width: 100% !important;
            }

            .print-page,
            .client-print-section {
              width: 196mm !important;
              max-width: 196mm !important;
              min-height: 282mm !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: hidden !important;
            }

            .print-page:last-child,
            .client-print-section:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            .report-block,
            .dashboard-card,
            .member-card,
            .chart-card,
            .table-card,
            .family-card,
            .summary-card,
            .card,
            .box,
            .section,
            table,
            tr,
            td,
            th,
            svg,
            canvas,
            img {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            .report-block,
            .dashboard-card,
            .member-card,
            .chart-card,
            .table-card,
            .family-card,
            .summary-card,
            .card,
            .box,
            .section {
              box-shadow: none !important;
            }

            /* דחיסה קלה כדי שהדוח ייכנס ל־3 עמודים */
            h1 {
              font-size: 18px !important;
            }

            h2 {
              font-size: 15px !important;
            }

            h3 {
              font-size: 13px !important;
            }

            p,
            span,
            div {
              font-size: 11px;
            }

            /* גריד הדפסה לאורך */
            [style*="grid-template-columns"] {
              gap: 8px !important;
            }

            /* שלא יפתח עמוד לכל ריבוע */
            .client-print-container .member-card,
            .client-print-container .dashboard-card,
            .client-print-container .chart-card {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            /* הסתרת כותרות דפדפן לא בשליטתנו לא אפשרית בקוד;
               צריך בהדפסה לכבות Headers and footers בדפדפן */
          }

          @media (max-width: 900px) {
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
        `}
      </style>

      <div
        className="client-print-page"
        style={{
          minHeight: "100vh",
          direction: "rtl",
          fontFamily: 'Calibri, "Arial", sans-serif',
          background: theme.pageBg,
          color: theme.text,
        }}
      >
        <div className="client-no-print" style={thinStickyBar}>
          <div className="thin-bar-inner" style={thinBarInner}>
            <div style={viewSelectorWrap}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={viewSelectorButton}
              >
                <span style={viewSelectorLabel}>שם לקוח:</span>
                <span style={viewSelectorValue}>{activeLabel}</span>
                <span style={viewSelectorArrow}>{menuOpen ? "▲" : "▼"}</span>
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
                <DownloadIcon />
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
            className="client-print-container"
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
                  <div
                    style={{
                      color: theme.navy,
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    {activeShareDetails?.clientName || "תצוגת לקוח"}
                  </div>
                  <div
                    style={{
                      color: theme.textSoft,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    ניתן לשמור את המסך כ־PDF דרך הכפתור העליון.
                  </div>
                </div>

                <button
                  onClick={handleExportPdf}
                  className="client-action-button primary"
                >
                  <DownloadIcon />
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

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3V14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M7.5 10L12 14.5L16.5 10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19H19"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoMini({ label, value }) {
  return (
    <span style={infoMini}>
      <span style={{ color: theme.textSoft }}>{label}:</span>
      <span style={{ color: theme.navy, fontWeight: 800 }}>{value}</span>
    </span>
  );
}

const thinStickyBar = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(10px)",
  borderBottom: `1px solid ${theme.border}`,
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

const viewSelectorWrap = {
  position: "relative",
  minWidth: 250,
};

const viewSelectorButton = {
  width: "100%",
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "11px 16px",
  borderRadius: 12,
  border: `1px solid ${theme.buttonBorder}`,
  background: "#ffffff",
  color: theme.text,
  fontFamily: 'Calibri, "Arial", sans-serif',
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16,42,67,0.04)",
};

const viewSelectorLabel = {
  color: theme.textSoft,
  fontWeight: 700,
};

const viewSelectorValue = {
  color: theme.navy,
  fontWeight: 900,
  flex: 1,
  textAlign: "right",
};

const viewSelectorArrow = {
  color: theme.navy,
  fontSize: 11,
};

const dropdown = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  left: 0,
  background: "#ffffff",
  border: `1px solid ${theme.buttonBorder}`,
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
  background: active ? "#F4F7FB" : "#ffffff",
  color: active ? theme.navy : theme.text,
  fontFamily: 'Calibri, "Arial", sans-serif',
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  textAlign: "right",
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
  background: theme.surfaceAlt,
  border: `1px solid ${theme.divider}`,
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
  border: `1px solid ${theme.buttonBorder}`,
  padding: "8px 10px",
  fontSize: 12,
  direction: "ltr",
  boxSizing: "border-box",
  color: theme.text,
};

const sharedNotice = {
  background: "#ffffff",
  border: `1px solid ${theme.border}`,
  borderRadius: 18,
  padding: "14px 18px",
  marginBottom: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  boxShadow: "0 2px 10px rgba(16,42,67,0.05)",
};

export default ClientDashboardPage;
