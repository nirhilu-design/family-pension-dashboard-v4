export function buildClientFamilyDataModel(reportData) {
  const safe = reportData || {};

  const family = safe.family || {};
  const members = Array.isArray(safe.members) ? safe.members : [];
  const products = Array.isArray(safe.products) ? safe.products : [];
  const managers = Array.isArray(safe.managers) ? safe.managers : [];

  const weightedEquityExposure = Number(safe.weightedEquityExposure || 0);
  const weightedForeignExposure = Number(safe.weightedForeignExposure || 0);

  return {
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
}

function buildClientMemberModel(member, index, reportData) {
  const memberName = member?.name || `לקוח ${index + 1}`;

  const products = extractMemberProducts(memberName, reportData);
  const managers = buildManagersFromProducts(products);

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
    products,
    managers,
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
  const rawFiles = Array.isArray(reportData?.rawParsedFiles)
    ? reportData.rawParsedFiles
    : [];

  const allPolicies = rawFiles.flatMap((file) => {
    const fileMemberName = file?.memberName || "";
    const fileMemberId = file?.parsedData?.member?.id || "";

    const policies = Array.isArray(file?.parsedData?.policies)
      ? file.parsedData.policies
      : [];

    return policies.map((policy, index) => ({
      ...policy,
      ownerName: fileMemberName,
      ownerId: fileMemberId,
      internalIndex: index,
    }));
  });

  const memberPolicies = allPolicies.filter(
    (policy) =>
      String(policy.ownerName || "").trim() === String(memberName || "").trim()
  );

  return memberPolicies.map((policy, index) => {
    const currentValue = Number(policy?.savings?.totalAccumulated || 0);

    const monthlyDeposit = Number(
      policy?.monthlyDeposits?.sumCost ||
        policy?.monthlyDeposits?.worker ||
        0
    );

    return {
      id:
        policy.policyNo ||
        `${createStableMemberId(memberName, index)}_${policy.rowNum || index}`,

      planName:
        policy.planName ||
        policy.productType ||
        policy.details?.proposeName ||
        "מוצר פנסיוני",

      managerName: policy.managerName || "—",

      productType: policy.productType || policy.details?.proposeName || "—",

      policyNo: policy.policyNo || "—",

      currentValue,

      monthlyDeposit,

      projectedLumpSumWithDeposits: Number(
        policy?.savings?.totalPidions || 0
      ),

      projectedLumpSumWithoutDeposits: Number(
        policy?.savings?.retireCurrBalance || 0
      ),

      projectedMonthlyPension: Number(
        policy?.savings?.pensionRetire ||
          policy?.savings?.projectedMonthlyPension ||
          0
      ),

      joinDate: policy.joinDate || null,

      retireAge: policy?.details?.retireAge || null,

      managementFeeFromDeposit: Number(
        policy?.details?.managementFeeFromDeposit || 0
      ),

      managementFeeFromBalance: Number(
        policy?.details?.managementFeeFromBalance || 0
      ),

      equityExposure: getPolicyEquityExposure(policy),

      foreignExposure: getPolicyForeignExposure(policy),

      raw: policy,
    };
  });
}

function buildManagersFromProducts(products) {
  const safeProducts = Array.isArray(products) ? products : [];
  const map = new Map();

  safeProducts.forEach((product) => {
    const name = product.managerName || "—";
    const value = Number(product.currentValue || 0);

    if (!map.has(name)) {
      map.set(name, {
        id: name,
        name,
        value: 0,
      });
    }

    map.get(name).value += value;
  });

  const managers = Array.from(map.values());
  const total = managers.reduce((sum, manager) => sum + manager.value, 0);

  return managers.map((manager) => ({
    ...manager,
    percent: total > 0 ? (manager.value / total) * 100 : 0,
  }));
}

function getPolicyEquityExposure(policy) {
  const investPlans = Array.isArray(policy?.investPlans)
    ? policy.investPlans
    : [];

  if (!investPlans.length) return 0;

  const total = investPlans.reduce(
    (sum, plan) => sum + Number(plan?.equityExposure || 0),
    0
  );

  return total / investPlans.length;
}

function getPolicyForeignExposure(policy) {
  const investPlans = Array.isArray(policy?.investPlans)
    ? policy.investPlans
    : [];

  if (!investPlans.length) return 0;

  const total = investPlans.reduce(
    (sum, plan) => sum + Number(plan?.foreignExposure || 0),
    0
  );

  return total / investPlans.length;
}

function createStableMemberId(name, index) {
  const cleanName = String(name || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\u0590-\u05FFa-zA-Z0-9_]/g, "");

  return cleanName ? `member_${cleanName}` : `member_${index + 1}`;
}
