import React, { useEffect, useId, useState } from "react";
import {
  awarenessBenefits,
  ecoPageContent,
  environmentReasons,
  greenHabits,
  indiaInitiatives,
  supportedSdgs,
} from "../data/eco-content";

const ExpandableContent = ({ openLabel, closeLabel, children }) => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        className="eco-expand-button"
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? closeLabel : openLabel}
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      <div className="eco-expand-panel" id={panelId} hidden={!expanded}>
        {children}
      </div>
    </>
  );
};

const SectionHeading = ({ copy, id }) => (
  <div className="eco-section__heading eco-reveal">
    <span className="eco-kicker">{copy.eyebrow}</span>
    <h2 id={id}>{copy.title}</h2>
    <p>{copy.intro}</p>
  </div>
);

const EcoLearningSections = () => {
  useEffect(() => {
    const revealItems = document.querySelectorAll(".eco-reveal");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="eco-learning">
      <section
        className="eco-section eco-section--reasons"
        id="eco-explore"
        aria-labelledby="eco-why-title"
      >
        <div className="eco-section__heading eco-reveal">
          <span className="eco-kicker">{ecoPageContent.reasons.eyebrow}</span>
          <h2 id="eco-why-title">{ecoPageContent.reasons.title}</h2>
          <p>{ecoPageContent.reasons.intro}</p>
        </div>
        <div className="eco-reasons-grid">
          {environmentReasons.map((reason) => (
            <article
              className="eco-reason-card eco-reveal"
              key={reason.title}
              tabIndex={0}
            >
              <span className="eco-reason-card__icon" aria-hidden="true">
                {reason.icon}
              </span>
              <h3>{reason.title}</h3>
              {reason.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section
        className="eco-section eco-section--sdgs"
        aria-labelledby="eco-sdgs-title"
      >
        <SectionHeading copy={ecoPageContent.sdgs} id="eco-sdgs-title" />
        <div className="eco-sdg-grid">
          {supportedSdgs.map((goal) => (
            <article
              className="eco-sdg-card eco-reveal"
              key={goal.number}
              style={{ "--sdg-color": goal.color }}
            >
              <div className="eco-sdg-card__top">
                <span className="eco-sdg-card__number">
                  {String(goal.number).padStart(2, "0")}
                </span>
                <span className="eco-sdg-card__label">UN GOAL</span>
              </div>
              <h3>{goal.name}</h3>
              <ExpandableContent
                openLabel={ecoPageContent.sdgs.expandLabel}
                closeLabel={ecoPageContent.sdgs.collapseLabel}
              >
                <h4>{ecoPageContent.sdgs.meaningLabel}</h4>
                <p>{goal.meaning}</p>
                <h4>{ecoPageContent.sdgs.studentLabel}</h4>
                <p>{goal.studentAction}</p>
              </ExpandableContent>
            </article>
          ))}
        </div>
      </section>

      <section
        className="eco-section eco-section--awareness"
        aria-labelledby="eco-awareness-title"
      >
        <SectionHeading
          copy={ecoPageContent.awareness}
          id="eco-awareness-title"
        />
        <ol className="eco-awareness-grid">
          {awarenessBenefits.map((benefit) => (
            <li className="eco-awareness-item eco-reveal" key={benefit.number}>
              <span aria-hidden="true">{benefit.number}</span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="eco-section eco-section--policies"
        aria-labelledby="eco-policy-title"
      >
        <SectionHeading copy={ecoPageContent.policies} id="eco-policy-title" />
        <div className="eco-policy-list">
          {indiaInitiatives.map((initiative, index) => (
            <article
              className="eco-policy-item eco-reveal"
              key={initiative.title}
            >
              <span className="eco-policy-item__index" aria-hidden="true">
                0{index + 1}
              </span>
              <div className="eco-policy-item__content">
                <h3>{initiative.title}</h3>
                <p>{initiative.summary}</p>
                <ExpandableContent
                  openLabel={ecoPageContent.policies.expandLabel}
                  closeLabel={ecoPageContent.policies.collapseLabel}
                >
                  <p>{initiative.more}</p>
                </ExpandableContent>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="eco-section eco-section--habits"
        aria-labelledby="eco-habits-title"
      >
        <SectionHeading copy={ecoPageContent.habits} id="eco-habits-title" />
        <ul className="eco-habits-list">
          {greenHabits.map((habit) => (
            <li className="eco-habit-item" key={habit}>
              <span aria-hidden="true">✓</span>
              {habit}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default EcoLearningSections;
