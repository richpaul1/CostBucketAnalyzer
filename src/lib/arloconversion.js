const { v4: uuidv4 } = require('uuid'); // npm install uuid

export function convert(
  caseStatementString,
  costCategoryName = "Cost Categories",
  accountId = "accountid"
) {
  const businessMappings = [];
  const costTargetsMap = new Map();
  const allCostTargets = [];

  const regex = /when\(\s*\((.+?)\),\s*"([^"]+)"\)/g;

  let match;
  while ((match = regex.exec(caseStatementString)) !== null) {
    const fullCondition = match[1].trim();
    const costBucketName = match[2];

    const viewConditions = [];

    // Regex for service code remains the same
    const serviceCodeMatch = fullCondition.match(/"AWS_SERVICE"\s*=\s*"([^"]+)"/);
    if (serviceCodeMatch) {
      viewConditions.push({
        type: "VIEW_ID_CONDITION",
        viewField: {
          fieldId: "awsServicecode",
          fieldName: "Service Code",
          identifier: "AWS",
          identifierName: "AWS",
        },
        viewOperator: "IN", // Service code remains 'IN'
        values: [serviceCodeMatch[1]],
      });
    }

    // --- UPDATED LOGIC FOR USAGE TYPE (contains becomes LIKE, strip trailing hyphen) ---
    const usageTypeMatch = fullCondition.match(/contains\("USAGE_TYPE",\s*"([^"]+)"\)/);
    const notUsageTypeMatch = fullCondition.match(/NOT\s+contains\("USAGE_TYPE",\s*"([^"]+)"\)/);

    if (usageTypeMatch) {
      let usageValue = usageTypeMatch[1];
      // Remove trailing hyphen if present
      if (usageValue.endsWith('-')) {
        usageValue = usageValue.slice(0, -1);
      }
      viewConditions.push({
        type: "VIEW_ID_CONDITION",
        viewField: {
          fieldId: "awsUsagetype",
          fieldName: "Usage Type",
          identifier: "AWS",
          identifierName: "AWS",
        },
        viewOperator: "LIKE", // Changed to LIKE
        values: [usageValue],
      });
    } else if (notUsageTypeMatch) {
      // For 'NOT contains', we'll also apply the stripping logic and use 'NOT_LIKE'
      let usageValue = notUsageTypeMatch[1];
      if (usageValue.endsWith('-')) {
        usageValue = usageValue.slice(0, -1);
      }
      // Note: The schema provided initially only showed 'IN' and 'LIKE'.
      // If 'NOT_LIKE' is not supported by your backend, this part might need adjustment.
      console.warn(`Warning: The 'NOT contains' condition for USAGE_TYPE ("${notUsageTypeMatch[1]}") is being mapped to 'NOT_LIKE' with stripped value "${usageValue}". Confirm if 'NOT_LIKE' is a supported operator.`);
      viewConditions.push({
        type: "VIEW_ID_CONDITION",
        viewField: {
          fieldId: "awsUsagetype",
          fieldName: "Usage Type",
          identifier: "AWS",
          identifierName: "AWS",
        },
        viewOperator: "NOT_LIKE", // Assuming NOT_LIKE is a valid operator if LIKE is
        values: [usageValue],
      });
    }

    if (viewConditions.length > 0) {
      let existingCostTarget = costTargetsMap.get(costBucketName);

      if (existingCostTarget) {
        existingCostTarget.rules.push({ viewConditions });
      } else {
        const newCostTarget = {
          uuid: uuidv4(),
          name: costBucketName,
          marginPercentage: null,
          rules: [{ viewConditions }],
        };
        costTargetsMap.set(costBucketName, newCostTarget);
        allCostTargets.push(newCostTarget);
      }
    }
  }

  const now = Date.now();

  businessMappings.push({
    uuid: uuidv4(),
    name: costCategoryName,
    accountId: accountId,
    costTargets: allCostTargets,
    sharedCosts: null,
    unallocatedCost: {
      type: "UNALLOCATED_COST_TARGET",
      uuid: uuidv4(),
      name: "Unallocated",
      marginPercentage: null,
      rules: []
    },
    dataSources: ["AWS"],
    createdAt: now,
    lastUpdatedAt: now,
    createdBy: {
      id: "api_user",
      name: "API User",
      email: "api@example.com",
      type: "SERVICE_USER"
    },
    lastUpdatedBy: {
      id: "api_user",
      name: "API User",
      email: "api@example.com",
      type: "SERVICE_USER"
    }
  });

  return {
    metaData: {},
    resource: {
      businessMappings: businessMappings,
      totalCount: businessMappings.length,
    },
    responseMessages: [],
  };
}


module.exports = {
  convert,
};



