function ClientMemberView({ member }) {
  if (!member) return <div>לא נמצא לקוח</div>;

  return (
    <div>
      <h1>{member.name}</h1>

      <h2>סיכום</h2>
      <p>נכסים: {member.summary?.totalAssets}</p>
      <p>הפקדה חודשית: {member.summary?.totalMonthlyDeposit}</p>
      <p>צבירה: {member.summary?.projectedRetirementCapital}</p>
      <p>קצבה: {member.summary?.projectedMonthlyPension}</p>

      <h2>חשיפות</h2>
      <p>מניות: {member.exposures?.stocks}%</p>
      <p>חו"ל: {member.exposures?.abroad}%</p>

      <h2>תוכניות</h2>

      {(member.plans || []).map((p, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <p>{p.planName}</p>
          <p>{p.managerName}</p>
          <p>{p.currentValue}</p>
        </div>
      ))}
    </div>
  );
}

export default ClientMemberView;
