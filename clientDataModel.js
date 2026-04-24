export function buildClientFamilyDataModel(reportData) {
  const safe = reportData || {};

  const family = safe.family || {};
  const members = Array.isArray(safe.members) ? safe.members : [];
  const products = Array.isArray(safe.products) ? safe.products : [];
  const managers = Array.isArray(safe.managers) ? safe.managers : [];

  const weightedEquityExposure = Number(safe.weightedEquityExposure || 0);
  const weightedForeignExposure = Number(safe.weightedForeignExposure || 0);

  const familyModel = {
    id: "family",
    type: "family",
    title: "תמונה משפחתית מאוחדת",
    lastUpdated: family.lastUpdated || "",
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
      equity: weightedEquityExposure,
      foreign: weightedForeignExposure,
    },
    distributions: {
      products: normalizeDistribution(products),
      managers: normalizeDistribution(managers),
      mainGroups: normalizeDistribution(safe.mainGroupAllocation || []),
      foreignExposure: normalizeDistribution(
        safe.foreignExposureAllocation || []
      ),
    },
    members: members.map((member, index) =>
      buildClientMemberModel(member, index, safe)
    ),
    loans: safe.loans || { hasData: false, details: [] },
    rawReportData: safe,
  };

  return familyModel;
}

function buildClientMemberModel(member, index, reportData) {
  const memberName = member?.name || `לקוח ${index + 1}`;

  return {
    id: createStableMemberId(memberName, index),
    type: "member",
    name: memberName,
    order: index + 1,
    summary: {
      totalAssets: Number(member?.assets || 0),
      monthlyDeposits: Number(member?.monthlyDeposits || 0),
      projectedLumpSumWithDeposits: Number(member?.lumpSumWithDeposits || 0),
      projectedLumpSumWithoutDeposits: Number(
        member?.lumpSumWithoutDeposits || 0
      ),
      monthlyPensionWithDeposits: Number(
        member?.monthlyPensionWithDeposits || 0
      ),
      monthlyPensionWithoutDeposits: Number(
        member?.monthlyPensionWithoutDeposits || 0
      ),
    },
    insurance: {
      deathCoverage: Number(member?.deathCoverage || 0),
      disabilityValue: Number(member?.disabilityValue || 0),
      disabilityPercent: Number(member?.disabilityPercent || 0),
    },
    exposures: {
      equity: Number(member?.weightedEquityExposure || 0),
      foreign: Number(member?.weightedForeignExposure || 0),
    },
    products: extractMemberProducts(memberName, reportData),
    managers: extractMemberManagers(memberName, reportData),
    rawMember: member,
  };
}

function normalizeDistribution(items) {
  const safeItems = Array.isArray(items) ? items : [];

  const total = safeItems.reduce(
    (sum, item) => sum + Number(item?.value || 0),
    0
  );

  return safeItems.map((item, index) => {
    const value = Number(item?.value || 0);

    return {
      id: item?.id || `${item?.name || "item"}_${index}`,
      name: item?.name || "ללא שם",
      value,
      percent: total > 0 ? (value / total) * 100 : Number(item?.percent || 0),
    };
  });
}

function extractMemberProducts(memberName, reportData) {
  const allPlans =
    reportData?.plans ||
    reportData?.allPlans ||
    reportData?.policies ||
    reportData?.productsDetailed ||
    [];

  if (!Array.isArray(allPlans)) return [];

  return allPlans
    .filter((plan) => {
      const owner =
        plan.memberName ||
        plan.ownerName ||
        plan.name ||
        plan.fullName ||
        "";
      return String(owner).trim() === String(memberName).trim();
    })
    .map((plan, index) => ({
      id: plan.id || `${memberName}_plan_${index}`,
      planName: plan.planName || plan.PlanName || plan.name || "מוצר פנסיוני",
      managerName:
        plan.managerName ||
        plan.ManufacturerName ||
        plan.companyName ||
        plan.manager ||
        "—",
      productType: plan.productType || plan.type || "—",
      currentValue: Number(plan.currentValue || plan.assets || plan.value || 0),
      monthlyDeposit: Number(
        plan.monthlyDeposit || plan.monthlyDeposits || plan.deposit || 0
      ),
      raw: plan,
    }));
}

function extractMemberManagers(memberName, reportData) {
  const memberProducts = extractMemberProducts(memberName, reportData);

  const map = new Map();

  memberProducts.forEach((product) => {
    const managerName = product.managerName || "—";
    const currentValue = Number(product.currentValue || 0);

    if (!map.has(managerName)) {
      map.set(managerName, {
        id: managerName,
        name: managerName,
        value: 0,
        percent: 0,
      });
    }

    map.get(managerName).value += currentValue;
  });

  const managers = Array.from(map.values());
  const total = managers.reduce((sum, item) => sum + item.value, 0);

  return managers.map((item) => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0,
  }));
}

function createStableMemberId(name, index) {
  const cleanName = String(name || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\u0590-\u05FFa-zA-Z0-9_]/g, "");

  return cleanName ? `member_${cleanName}` : `member_${index + 1}`;
}
