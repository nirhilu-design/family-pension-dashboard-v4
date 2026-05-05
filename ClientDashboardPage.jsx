import React, { useMemo, useState } from "react";
import ClientFamilyView from "./ClientFamilyView";
import ClientMemberView from "./ClientMemberView";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDistributionItems(items) {
  return safeArray(items)
    .map((item, index) => ({
      id: item?.id || item?.name || `distribution-${index}`,
      name: item?.name || item?.label || item?.title || "ללא שם",
      value: Number(item?.value || item?.amount || item?.assets || 0),
      percent: Number(item?.percent || item?.percentage || 0),
    }))
    .filter((item) => item.value > 0 || item.percent > 0);
}

function buildClientModelFromReportData(reportData) {
  const data = reportData || {};
  const family = data.family || {};

  const products = normalizeDistributionItems(data.products);
  const managers = normalizeDistributionItems(data.managers);
  const mainGroupAllocation = normalizeDistributionItems(data.mainGroupAllocation);

  return {
    lastUpdated:
      family.lastUpdated ||
      data.lastUpdated ||
      new Intl.DateTimeFormat("he-IL").format(new Date()),

    summary: {
      totalAssets: Number(family.totalAssets || 0),
      monthlyDeposits: Number(family.monthlyDeposits || 0),
      projectedLumpSumWithDeposits: Number(
        family.projectedLumpSumWithDeposits || 0
      ),
      projectedLumpSumWithoutDeposits: Number(
        family.projectedLumpSumWithoutDeposits || 0
      ),
      monthlyPensionWithDeposits: Number(
        family.monthlyPensionWithDeposits || 0
      ),
      monthlyPensionWithoutDeposits: Number(
        family.monthlyPensionWithoutDeposits || 0
      ),
    },

    exposures: {
      equity: Number(data.weightedEquityExposure || 0),
      foreign: Number(data.weightedForeignExposure || 0),
    },

    distributions: {
      products,
      managers,
      mainGroups: mainGroupAllocation,
      mainGroupAllocation,
      assetClasses: mainGroupAllocation,
      foreignExposureAllocation: normalizeDistributionItems(
        data.foreignExposureAllocation
      ),
    },

    members: safeArray(data.members).map((member, index) => ({
      id: member?.id || member?.name || `member-${index}`,
      name: member?.name || "ללא שם",

      summary: {
        totalAssets: Number(member?.assets || member?.totalAssets || 0),
        monthlyDeposits: Number(member?.monthlyDeposits || 0),
        monthlyPensionWithDeposits: Number(
          member?.monthlyPensionWithDeposits || 0
        ),
        monthlyPensionWithoutDeposits: Number(
          member?.monthlyPensionWithoutDeposits || 0
        ),
        projectedLumpSumWithDeposits: Number(
          member?.lumpSumWithDeposits ||
            member?.projectedLumpSumWithDeposits ||
            0
        ),
        projectedLumpSumWithoutDeposits: Number(
          member?.lumpSumWithoutDeposits ||
            member?.projectedLumpSumWithoutDeposits ||
            0
        ),
      },

      insurance: {
        deathCoverage: Number(member?.deathCoverage || 0),
        disabilityValue: Number(member?.disabilityValue || 0),
        disabilityPercent: Number(member?.disabilityPercent || 0),
      },
    })),

    loans: {
      hasData: Boolean(data.loans?.hasData),
      details: safeArray(data.loans?.details),
    },

    sourceReportData: data,
  };
}

function getPlanWeightedExposure(policy, key) {
  const plans = safeArray(policy?.investPlans);

  if (!plans.length) {
    return 0;
  }

  const total = plans.reduce((sum, plan) => {
    const value = Number(
      key === "equity"
        ? plan?.equityExposure || 0
        : plan?.foreignExposure || 0
    );
    return sum + value;
  }, 0);

  return total / plans.length;
}

function buildMemberProductsFromRawFile(rawFile) {
  const policies = safeArray(rawFile?.parsedData?.policies);

  return policies.map((policy, index) => {
    const currentValue = Number(policy?.savings?.totalAccumulated || 0);

    return {
      id:
        policy?.policyNo ||
        `${rawFile?.memberName || "member"}-${policy?.rowNum || index}`,
      planName:
        policy?.planName ||
        policy?.details?.proposeName ||
        policy?.productType ||
        "מוצר ללא שם",
      managerName: policy?.managerName || "לא ידוע",
      productType: policy?.productType || "ללא סוג",
      policyNo: policy?.policyNo || "",
      currentValue,
      monthlyDeposit: Number(policy?.monthlyDeposits?.sumCost || 0),
      projectedMonthlyPension: Number(
        policy?.savings?.projectedMonthlyPension ||
          policy?.savings?.pensionRetire ||
          0
      ),
      managementFeeFromBalance: Number(
        policy?.details?.managementFeeFromBalance || 0
      ),
      equityExposure: getPlanWeightedExposure(policy, "equity"),
      foreignExposure: getPlanWeightedExposure(policy, "foreign"),
    };
  });
}

function groupItemsByValue(items, getName, getValue) {
  const map = new Map();

  safeArray(items).forEach((item) => {
    const name = getName(item) || "אחר";
    const value = Number(getValue(item) || 0);

    if (value <= 0) return;

    map.set(name, (map.get(name) || 0) + value);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ id: name, name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildDetailedMembers(reportData, clientModel) {
  const summaryMembers = safeArray(clientModel?.members);
  const rawFiles = safeArray(reportData?.rawParsedFiles);

  return summaryMembers.map((summaryMember, index) => {
    const rawFile =
      rawFiles.find((file) => file?.memberName === summaryMember?.name) ||
      rawFiles[index] ||
      null;

    const products = buildMemberProductsFromRawFile(rawFile);
    const totalProductsValue = products.reduce(
      (sum, product) => sum + Number(product.currentValue || 0),
      0
    );

    const weightedEquity =
      totalProductsValue > 0
        ? products.reduce(
            (sum, product) =>
              sum +
              Number(product.currentValue || 0) *
                Number(product.equityExposure || 0),
            0
          ) / totalProductsValue
        : 0;

    const weightedForeign =
      totalProductsValue > 0
        ? products.reduce(
            (sum, product) =>
              sum +
              Number(product.currentValue || 0) *
                Number(product.foreignExposure || 0),
            0
          ) / totalProductsValue
        : 0;

    return {
      ...summaryMember,
      id: summaryMember?.id || summaryMember?.name || `member-${index}`,
      name: summaryMember?.name || rawFile?.memberName || "ללא שם",
      products,
      managers: groupItemsByValue(
        products,
        (product) => product.managerName,
        (product) => product.currentValue
      ),
      exposures: {
        equity: Math.round(weightedEquity),
        foreign: Math.round(weightedForeign),
      },
    };
  });
}

function findSelectedMember(members, selectedMemberId) {
  if (!members.length) return null;

  if (!selectedMemberId) return members[0];

  const wanted = String(selectedMemberId);

  return (
    members.find(
      (member) =>
        String(member?.id || "") === wanted ||
        String(member?.name || "") === wanted
    ) || members[0]
  );
}

function EmptyDashboardState({ onBack }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        direction: "rtl",
        fontFamily: 'Calibri, "Arial", sans-serif',
        background: "#F9F7F3",
        color: "#102A43",
        padding: 32,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#FFFFFF",
          border: "1px solid #E2D1BF",
          borderRadius: 22,
          padding: 32,
          boxShadow: "0 10px 28px rgba(16,42,67,0.08)",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 0 12px",
            color: "#00215D",
            fontSize: 28,
            lineHeight: 1.25,
            fontWeight: 800,
          }}
        >
          אין נתוני דוח להצגה
        </h1>

        <p
          style={{
            margin: "0 auto 22px",
            maxWidth: 560,
            color: "#627D98",
            fontSize: 15,
            lineHeight: 1.8,
          }}
        >
          מסך הלקוח מקבל את הנתונים ישירות מהדוח שנוצר במערכת. חזור למסך הדוח
          או הפק דוח חדש.
        </p>

        <button
          type="button"
          onClick={onBack}
          style={{
            minWidth: 160,
            minHeight: 44,
            border: "1px solid #D9DDE8",
            borderRadius: 12,
            background: "#FFFFFF",
            color: "#102A43",
            fontWeight: 800,
            fontFamily: 'Calibri, "Arial", sans-serif',
            cursor: "pointer",
          }}
        >
          חזרה
        </button>
      </div>
    </div>
  );
}

function ClientTopActions({
  viewMode,
  members,
  selectedMemberId,
  onBack,
  onChangeView,
  isSharedMode,
}) {
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);

  if (isSharedMode) return null;

  return (
    <div
      className="client-no-print"
      style={{
        direction: "rtl",
        maxWidth: 1280,
        margin: "0 auto 16px",
        padding: "0 8px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        fontFamily: 'Calibri, "Arial", sans-serif',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={topButton}
      >
        חזרה לדוח הראשי
      </button>

      <button
        type="button"
        onClick={() => onChangeView("family", null)}
        style={{
          ...topButton,
          ...(viewMode === "family" ? topButtonActive : null),
        }}
      >
        דוח משפחתי
      </button>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setMemberMenuOpen((value) => !value)}
          style={{
            ...topButton,
            ...(viewMode === "member" ? topButtonActive : null),
          }}
        >
          דוח פרט
        </button>

        {memberMenuOpen ? (
          <div style={memberDropdown}>
            {members.map((member) => (
              <button
                key={member.id || member.name}
                type="button"
                onClick={() => {
                  onChangeView("member", member.id || member.name);
                  setMemberMenuOpen(false);
                }}
                style={{
                  ...memberDropdownItem,
                  ...(String(selectedMemberId || "") ===
                    String(member.id || member.name)
                    ? memberDropdownItemActive
                    : null),
                }}
              >
                {member.name || "ללא שם"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const topButton = {
  minWidth: 150,
  minHeight: 42,
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #D9DDE8",
  background: "#FFFFFF",
  color: "#102A43",
  fontWeight: 800,
  fontFamily: 'Calibri, "Arial", sans-serif',
  cursor: "pointer",
};

const topButtonActive = {
  borderColor: "#00215D",
  background: "#00215D",
  color: "#FFFFFF",
};

const memberDropdown = {
  position: "absolute",
  top: 48,
  right: 0,
  width: 230,
  background: "#FFFFFF",
  border: "1px solid #E2D1BF",
  borderRadius: 16,
  boxShadow: "0 18px 40px rgba(16,42,67,0.14)",
  padding: 10,
  zIndex: 20,
};

const memberDropdownItem = {
  width: "100%",
  minHeight: 42,
  border: "1px solid #EEE4D8",
  borderRadius: 12,
  background: "#FFFFFF",
  color: "#102A43",
  fontWeight: 800,
  textAlign: "right",
  padding: "8px 12px",
  marginBottom: 8,
  cursor: "pointer",
  fontFamily: 'Calibri, "Arial", sans-serif',
};

const memberDropdownItemActive = {
  borderColor: "#00215D",
  background: "#F4F7FB",
  color: "#00215D",
};

export default function ClientDashboardPage({
  reportData,
  onBack = () => {},
  isSharedMode = false,
  viewMode = "family",
  selectedMemberId = null,
  onChangeView = () => {},
}) {
  const clientModel = useMemo(
    () => buildClientModelFromReportData(reportData),
    [reportData]
  );

  const detailedMembers = useMemo(
    () => buildDetailedMembers(reportData, clientModel),
    [reportData, clientModel]
  );

  const selectedMember = findSelectedMember(
    detailedMembers,
    selectedMemberId
  );

  if (!reportData || !reportData.family) {
    return <EmptyDashboardState onBack={onBack} />;
  }

  return (
    <div style={{ background: "#F9F7F3", minHeight: "100vh", padding: 16 }}>
      <ClientTopActions
        viewMode={viewMode}
        members={detailedMembers}
        selectedMemberId={selectedMemberId}
        onBack={onBack}
        onChangeView={onChangeView}
        isSharedMode={isSharedMode}
      />

      {viewMode === "member" ? (
        <ClientMemberView member={selectedMember} />
      ) : (
        <ClientFamilyView clientModel={clientModel} />
      )}
    </div>
  );
}
