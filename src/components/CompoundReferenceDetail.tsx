import { useEffect, useRef } from "react";
import { elementById } from "../data/catalog";
import { elementName, useI18n } from "../i18n";
import {
  compoundSourceCopy,
  localizeCompoundReference,
} from "../i18n/exploration-en";
import { CompoundFormula } from "./CompoundFormula";

export interface CompoundReference {
  id?: string;
  name: string;
  formula: string;
  aliases: string[];
  nameExplanation: string;
  summary: string;
  composition: Record<string, number>;
  cas?: string;
  molarMass?: string | number;
  sourceIds: string[];
}

export interface CompoundReferenceSource {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  accessed?: string;
  note?: string;
  verification?: string;
}

export function CompoundReferenceDetail({
  reference,
  sources,
  reduced,
  onClose,
}: {
  reference: CompoundReference;
  sources: CompoundReferenceSource[];
  reduced: boolean;
  onClose: () => void;
}) {
  const { language, t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const localizedReference = localizeCompoundReference(reference, language);
  const localizedSources = sources.map((source) =>
    compoundSourceCopy(source, language),
  );
  const composition = Object.entries(localizedReference.composition).filter(
    ([, count]) => count > 0,
  );

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="compound-reference"
      data-reduced={reduced ? "true" : "false"}
      aria-labelledby="compound-reference-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="compound-reference__panel">
        <button
          type="button"
          className="compound-reference__close"
          aria-label={t("关闭化合物资料", "Close compound details")}
          autoFocus
          onClick={onClose}
        >
          ×
        </button>
        <p className="compound-reference__kind">{t("教材外参考", "External reference")}</p>
        <div className="compound-reference__formula">
          <CompoundFormula value={reference.formula} />
        </div>
        <h2 id="compound-reference-title">{localizedReference.name}</h2>
        {localizedReference.aliases.length > 0 && (
          <p className="compound-reference__aliases">
            {t("又称：", "Also known as: ")}{localizedReference.aliases.join(language === "zh" ? "、" : ", ")}
          </p>
        )}
        <section className="compound-reference__section">
          <h3>{t("名称解释", "Name and formula")}</h3>
          <p>{localizedReference.nameExplanation}</p>
        </section>
        <section className="compound-reference__section">
          <h3>{t("简介", "About this entry")}</h3>
          <p>{localizedReference.summary}</p>
        </section>
        {composition.length > 0 && (
          <section className="compound-reference__section">
            <h3>{t("化学式中的原子数比", "Atom counts in the formula")}</h3>
            <p>{t("按所示化学式计数；含结晶水时一并计入。", "Count the displayed formula; include waters of crystallization where shown.")}</p>
            <ul className="compound-reference__composition">
              {composition.map(([elementId, count]) => {
                const element = elementById[elementId];
                return (
                  <li key={elementId}>
                    <span>{element ? elementName(element, language) : elementId}</span>
                    <span>{count}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {(reference.cas || reference.molarMass !== undefined) && (
          <dl className="compound-reference__facts">
            {localizedReference.cas && (
              <div>
                <dt>CAS</dt>
                <dd>{localizedReference.cas}</dd>
              </div>
            )}
            {localizedReference.molarMass !== undefined && (
              <div>
                <dt>{t("摩尔质量", "Molar mass")}</dt>
                <dd>{localizedReference.molarMass} g·mol⁻¹</dd>
              </div>
            )}
          </dl>
        )}
        {sources.length > 0 && (
          <details className="compound-reference__sources">
            <summary>{t("资料来源", "Sources")}</summary>
            <p className="compound-reference__source-intro">
              {t(
                "身份、组成与摩尔质量据 PubChem 公开数据核对；中文说明为本站整理。",
                "Project notes record a data-level check of identity, composition, and molar mass against PubChem. Explanatory text on this site is editorial, not a source quotation or a textbook-alignment claim.",
              )}
            </p>
            <ul>
              {localizedSources.map((source) => (
                <li key={source.id}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                  ) : (
                    <span>{source.title}</span>
                  )}
                  {(source.publisher || source.accessed) && (
                    <small>
                      {[source.publisher, source.accessed]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  )}
                  {language === "en" && source.note && <small>{source.note}</small>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </article>
    </dialog>
  );
}
