const equality = ["==", "!="];
const ordered = ["==", "!=", ">=", ">", "<=", "<"];

const symbols: Record<string, string> = {
  "==": "=",
  "!=": "≠",
  ">=": "≥",
  "<=": "≤",
};

// Only the comparisons that are meaningful for the data type are offered; ordering Boolean or Text values is not useful.
export const comparisonsFor = (dataTypeName: string): string[] => {
  switch (dataTypeName) {
    case "Decimal":
    case "Integer":
    case "DateTime":
      return ordered;
    default:
      return equality;
  }
};

export const comparisonSymbol = (comparison: string): string => symbols[comparison] ?? comparison;
