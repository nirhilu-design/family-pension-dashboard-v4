import { useState } from "react";
import ClientFamilyView from "./ClientFamilyView";
import ClientMemberView from "./ClientMemberView";

function ClientDashboardPage({ reportData, onBack }) {
  const [activeView, setActiveView] = useState("family");

  if (!reportData) {
    return <div style={{ padding: "40px", direction: "rtl" }}>אין נתונים</div>;
  }

  const members = reportData.members || [];

  let content;

  if (activeView === "family") {
    content = <ClientFamilyView reportData={reportData} />;
  } else {
    const selectedMember = members.find((member) => member.name === activeView);
    content = <ClientMemberView member={selectedMember} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        direction: "rtl",
        fontFamily: 'Calibri, "Arial", sans-serif',
        background: "#F7F5F1",
      }}
    >
      <aside
        style={{
          width: "260px",
          background: "#ffffff",
          borderLeft: "1px solid #DCCDBA",
          padding: "24px 18px",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#00215D" }}>ניווט</h2>

        <button
          onClick={() => setActiveView("family")}
          style={navButtonStyle(activeView === "family")}
        >
          משפחתי
        </button>

        {members.map((member) => (
          <button
            key={member.name}
            onClick={() => setActiveView(member.name)}
            style={navButtonStyle(activeView === member.name)}
          >
            {member.name}
          </button>
        ))}

        <div style={{ marginTop: "24px" }}>
          <button onClick={onBack} style={backButtonStyle}>
            חזרה לדוח
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "24px" }}>
        {content}
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

export default ClientDashboardPage;
