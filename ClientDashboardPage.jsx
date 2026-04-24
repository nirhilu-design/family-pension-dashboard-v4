import { useMemo, useState } from "react";
import ClientFamilyView from "./ClientFamilyView";
import ClientMemberView from "./ClientMemberView";
import { buildClientFamilyDataModel } from "./clientDataModel";

function ClientDashboardPage({
  reportData,
  onBack,
  onCreateShareLink,
  isSharedMode = false,
}) {
  const clientModel = useMemo(
    () => buildClientFamilyDataModel(reportData),
    [reportData]
  );

  const [activeView, setActiveView] = useState("family");
  const [shareLink, setShareLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  if (!reportData) {
    return <div style={{ padding: "40px", direction: "rtl" }}>אין נתונים</div>;
  }

  const members = clientModel.members || [];

  const selectedMember =
    activeView === "family"
      ? null
      : members.find((member) => member.id === activeView);

  const handleCreateLink = async () => {
    const link = onCreateShareLink?.();

    if (!link) {
      setCopyStatus("לא ניתן ליצור קישור כרגע");
      return;
    }

    setShareLink(link);

    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("הקישור נוצר והועתק");
    } catch {
      setCopyStatus("הקישור נוצר, ניתן להעתיק ידנית");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        direction: "rtl",
        fontFamily: 'Calibri, "Arial", sans-serif',
        background: "#F7F5F1",
        color: "#102A43",
      }}
    >
      <aside
        style={{
          width: "300px",
          background: "#ffffff",
          borderLeft: "1px solid #DCCDBA",
          padding: "24px 18px",
          boxSizing: "border-box",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
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

        {!isSharedMode && (
          <div style={shareBox}>
            <button onClick={handleCreateLink} style={shareButtonStyle}>
              צור קישור זמני ללקוח
            </button>

            {copyStatus && (
              <div style={{ marginTop: 10, color: "#3EAF63", fontWeight: 700 }}>
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
              בשלב זה הקישור נשמר מקומית בדפדפן לצורך בדיקות. בהמשך נחבר אותו
              לשמירה אמיתית בענן.
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

      <main style={{ flex: 1, padding: 24 }}>
        {activeView === "family" ? (
          <ClientFamilyView clientModel={clientModel} />
        ) : (
          <ClientMemberView member={selectedMember} />
        )}
      </main>
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

const shareBox = {
  marginTop: 24,
  padding: 14,
  borderRadius: 16,
  background: "#F7F8FC",
  border: "1px solid #D9DDE8",
};

export default ClientDashboardPage;
