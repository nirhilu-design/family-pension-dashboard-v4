import { useState } from "react";
import ClientFamilyView from "./ClientFamilyView";
import ClientMemberView from "./ClientMemberView";

function ClientDashboardPage({ reportData, onBack }) {
  const [activeView, setActiveView] = useState("family");

  if (!reportData) {
    return <div>אין נתונים</div>;
  }

  const members = reportData.familyMembers || [];

  let content;

  if (activeView === "family") {
    content = <ClientFamilyView reportData={reportData} />;
  } else {
    const selected = members.find((m) => m.id === activeView);
    content = <ClientMemberView member={selected} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "250px", background: "#f5f5f5", padding: "20px" }}>
        <h3>ניווט</h3>

        <button onClick={() => setActiveView("family")}>
          משפחתי
        </button>

        <hr />

        {members.map((m) => (
          <div key={m.id}>
            <button onClick={() => setActiveView(m.id)}>
              {m.name}
            </button>
          </div>
        ))}

        <hr />

        <button onClick={onBack}>חזרה לדוח</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "20px" }}>
        {content}
      </div>
    </div>
  );
}

export default ClientDashboardPage;
