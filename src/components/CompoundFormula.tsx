import { Fragment } from "react";

/** Render formula counts as subscripts while preserving hydrate coefficients. */
export function CompoundFormula({ value }: { value: string }) {
  const segments = value.split(/(?=[·⋅])/u);
  let hasFormulaContent = false;
  let hydrateCoefficientPending = false;

  const renderSegment = (segment: string) =>
    (segment.match(/·|⋅|\d+|\s+|./gu) ?? [segment]).map((token, index) => {
      if (token === "·" || token === "⋅") {
        hydrateCoefficientPending = true;
        return <Fragment key={index}>{token}</Fragment>;
      }
      if (/^\s+$/.test(token)) return <Fragment key={index}>{token}</Fragment>;
      if (/^\d+$/.test(token)) {
        const isCoefficient = !hasFormulaContent || hydrateCoefficientPending;
        hydrateCoefficientPending = false;
        hasFormulaContent = true;
        return isCoefficient ? (
          <Fragment key={index}>{token}</Fragment>
        ) : (
          <sub key={index}>{token}</sub>
        );
      }
      hydrateCoefficientPending = false;
      hasFormulaContent = true;
      return <Fragment key={index}>{token}</Fragment>;
    });

  return (
    <span className="compound-workbench__formula" aria-label={value}>
      {segments.map((segment, index) =>
        index === 0 ? (
          <Fragment key={index}>{renderSegment(segment)}</Fragment>
        ) : (
          <span key={index} className="compound-workbench__hydrate">
            {renderSegment(segment)}
          </span>
        ),
      )}
    </span>
  );
}
