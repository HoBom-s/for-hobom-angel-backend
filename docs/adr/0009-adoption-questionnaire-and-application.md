# ADR-0009: Adoption questionnaire + application snapshot

- Status: Accepted
- Date: 2026-07-11

## Context

Adoption (and later foster) needs a **shelter-customizable pre-application
survey**: each shelter's admin defines the questions an applicant must answer
before the shelter reviews them. The modeling fork is how flexible the survey
engine should be — a full form-builder (arbitrary field types, validation
rules, conditional logic) versus a fixed form. A form-builder is a project of
its own and most of it would go unused; a fixed form can't satisfy "the shelter
defines the questions."

Two correctness hazards drive the design: (1) questions can change after an
application is submitted, so a stored answer must stay interpretable against the
questions it was actually answering; (2) an application must be validated
against the questionnaire that was current at submit time.

## Decision

A **structured questionnaire**, not a form-builder. An `AdoptionQuestionnaire`
is a per-shelter aggregate: an ordered list of `Question` value objects, each
with a stable id, prompt, `required` flag, and a `type` from a closed set —
`TEXT`, `BOOLEAN`, `SINGLE_CHOICE`, `MULTI_CHOICE` (choice types carry
`options`). It is versioned; editing bumps the version.

An `AdoptionApplication` **snapshots** at submit time: it stores the answered
`questionnaireVersion` and the `Answer` list (questionId → value). Submission
validates the answers against the *current* questionnaire (all required
questions answered, choice values within `options`); after that the application
is self-contained and immune to later question edits.

The application's lifecycle rides the generic approval engine: submitting
reserves the animal and opens an `ADOPTION` approval; the decision callback
transitions the application and the animal together (approve → adopted, reject
→ animal released).

## Consequences

- Admins get real customization without a form-builder to build or secure.
- Answers stay interpretable forever (version + snapshot), so a shelter editing
  its questionnaire never corrupts past applications.
- No conditional/branching logic or custom validators; a shelter that needs
  those is out of scope until a concrete need appears.
- Foster will reuse this shape; whether to extract a shared `Questionnaire`
  (keyed by purpose) is deferred to the foster slice, when the second instance
  makes the real commonality visible — not guessed at now.
