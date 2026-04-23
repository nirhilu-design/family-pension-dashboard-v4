function ClientFamilyView({ reportData }) {
  return (
    <div>
      <h1>דשבורד משפחתי</h1>

      <h2>סיכום</h2>

      <p>סך נכסים: {reportData.summary?.totalAssets}</p>
      <p>הפקדה חודשית: {reportData.summary?.totalMonthlyDeposit}</p>
      <p>צבירה צפויה: {reportData.summary?.projectedRetirementCapital}</p>
      <p>קצבה צפויה: {reportData.summary?.projectedMonthlyPension}</p>

      <h2>חשיפות</h2>
      <p>מניות: {reportData.exposures?.stocks}%</p>
      <p>חו"ל: {reportData.exposures?.abroad}%</p>

      <h2>בני משפחה</h2>

      {(reportData.familyMembers || []).map((m) => (
        <div key={m.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <h3>{m.name}</h3>
          <p>נכסים: {m.summary?.totalAssets}</p>
          <p>קצבה: {m.summary?.projectedMonthlyPension}</p>
        </div>
      ))}
    </div>
  );
}

export default ClientFamilyView;
