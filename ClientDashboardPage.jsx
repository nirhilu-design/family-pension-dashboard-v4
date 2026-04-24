import { useMemo, useState } from "react";
import ClientFamilyView from "./ClientFamilyView";
import ClientMemberView from "./ClientMemberView";
import { buildClientFamilyDataModel } from "./clientDataModel";
import {
  formatShareDate,
  isShareExpired,
} from "./shareStorage";

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
        `}
      </style>

      <div
        className="client-print-page"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "row",
          direction: "rtl",
          fontFamily: 'Calibri, "Arial", sans-serif',
          background: "#F7F5F1",
          color: "#102A43",
          overflow: "hidden",
        }}
      >
        <aside
          className="client-no-print"
          style={{
            width: "300px",
            minWidth: "300px",
            maxWidth: "300px",
            flexShrink: 0,
            background: "#ffffff",
            borderLeft: "1px solid #DCCDBA",
            padding: "24px 18px",
            boxSizing: "border-box",
            height: "100vh",
            overflowY: "auto",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#00215D", fontSize: 22 }}>
            תצוגת לקוח
          </h2>

          <div
            style={{
              fontSize: 13,
              color: "#627D98",
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            מעבר בין מבט משפחתי לבין נתונים אישיים לכל אחד מבני המשפחה.
          </div>

          <button
            onClick={() => setActiveView("family")}
            style={navButtonStyle(activeView === "family")}
          >
            משפחתי
          </button>

          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => setActiveView(member.id)}
              style={navButtonStyle(activeView === member.id)}
            >
              {member.name}
            </button>
          ))}

          <div style={pdfBox}>
            <button onClick={handleExportPdf} style={pdfButtonStyle}>
              הורד / שמור כ־PDF
            </button>

            <div
              style={{
                marginTop: 10,
                color: "#627D98",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              הלחיצה תפתח חלון הדפסה. כדי לשמור קובץ, בחר “Save as PDF”.
            </div>
          </div>

          {activeShareDetails && (
            <div style={shareInfoBox}>
              <div style={shareInfoTitle}>פרטי קישור</div>

              <InfoLine
                label="שם"
                value={activeShareDetails.clientName || "לקוח ללא שם"}
              />

              <InfoLine
                label="נוצר"
                value={formatShareDate(activeShareDetails.createdAt)}
              />

              <InfoLine
                label="תוקף עד"
                value={formatShareDate(activeShareDetails.expiresAt)}
              />

              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: expired ? "#FFF5F5" : "#EEF8F0",
                  color: expired ? "#B42318" : "#2F7D46",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {expired ? "פג תוקף" : "קישור פעיל"}
              </div>
            </div>
          )}

          {!isSharedMode && (
            <div style={shareBox}>
              <button onClick={handleCreateLink} style={shareButtonStyle}>
                צור קישור זמני ללקוח
              </button>

              {copyStatus && (
                <div
                  style={{
                    marginTop: 10,
                    color: copyStatus.includes("לא") ? "#B42318" : "#3EAF63",
                    fontWeight: 700,
                  }}
                >
                  {copyStatus}
                </div>
              )}

              {shareLink && (
                <textarea
                  readOnly
                  value={shareLink}
                  style={{
                    width: "100%",
                    minHeight: 82,
                    marginTop: 10,
                    borderRadius: 12,
                    border: "1px solid #D9DDE8",
                    padding: 10,
                    fontSize: 12,
                    direction: "ltr",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              )}

              <div
                style={{
                  marginTop: 10,
                  color: "#627D98",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                בשלב זה הקישור נשמר מקומית בדפדפן לצורך בדיקות. במחשב או נייד
                אחר הוא לא יעבוד עד שנחבר אחסון ענן מאובטח.
              </div>
            </div>
          )}

          {!isSharedMode && (
            <div style={{ marginTop: 24 }}>
              <button onClick={onBack} style={backButtonStyle}>
                חזרה לדוח
              </button>
            </div>
          )}
        </aside>

        <main
          className="client-print-main"
          style={{
            flex: 1,
            minWidth: 0,
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            padding: 24,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {isSharedMode && (
              <div
                className="client-no-print"
                style={{
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
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#00215D",
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {activeShareDetails?.clientName || "תצוגת לקוח"}
                  </div>
                  <div style={{ color: "#627D98", fontSize: 13, marginTop: 4 }}>
                    ניתן לשמור את המסך כ־PDF דרך הכפתור בצד.
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

function InfoLine({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "7px 0",
        borderBottom: "1px solid #EEE4D8",
        fontSize: 12,
      }}
    >
      <span style={{ color: "#627D98" }}>{label}</span>
      <span style={{ color: "#00215D", fontWeight: 700, textAlign: "left" }}>
        {value}
      </span>
    </div>
  );
}

const navButtonStyle = (active) => ({
  width: "100%",
  padding: "12px 14px",
  marginBottom: "10px",
  borderRadius: "12px",
  border: active ? "1px solid #4F66E8" : "1px solid #D9DDE8",
  background: active ? "#4F66E8" : "#ffffff",
  color: active ? "#ffffff" : "#102A43",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
  textAlign: "right",
});

const backButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #D9DDE8",
  background: "#ffffff",
  color: "#102A43",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
};

const shareButtonStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "12px",
  border: "1px solid #4F66E8",
  background: "#4F66E8",
  color: "#ffffff",
  fontWeight: 800,
  fontSize: "14px",
  cursor: "pointer",
};

const pdfButtonStyle = {
  width: "100%",
  padding: "13px 14px",
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

const shareBox = {
  marginTop: 18,
  padding: 14,
  borderRadius: 16,
  background: "#F7F8FC",
  border: "1px solid #D9DDE8",
};

const pdfBox = {
  marginTop: 22,
  padding: 14,
  borderRadius: 16,
  background: "#F7F8FC",
  border: "1px solid #D9DDE8",
};

const shareInfoBox = {
  marginTop: 18,
  padding: 14,
  borderRadius: 16,
  background: "#FCFBF8",
  border: "1px solid #EEE4D8",
};

const shareInfoTitle = {
  color: "#00215D",
  fontWeight: 800,
  marginBottom: 8,
  fontSize: 14,
};

export default ClientDashboardPage;
