<!--
Sync Impact Report
- Version change: none -> 1.0.0 (initial constitution)
- Modified principles: none
- Added sections: Core Principles, Architecture Constraints, Development Workflow
- Removed sections: none
- Follow-up TODOs: RATIFICATION_DATE remains TODO because the original adoption date
	is not available in the repository.
-->

# Shell App Constitution

## Core Principles

### I. Domain-Centered Design
Business rules MUST live in the domain layer and MUST NOT depend on UI frameworks,
transport protocols, persistence, or infrastructure details. Domain concepts MUST
be represented explicitly through cohesive types and behavior. This keeps business
meaning stable while adapters and delivery mechanisms evolve.

### II. Dependency Inversion and Explicit Boundaries
Dependencies MUST point toward policy: presentation and infrastructure code may
depend on application and domain code, but inner layers MUST NOT depend on outer
layers. External systems MUST be accessed through interfaces owned by the inner
layer, with adapters implementing those interfaces at the boundary. Cross-layer
coupling MUST be treated as an architectural defect.

### III. Single Responsibility and Cohesive Components
Each module, class, and function MUST have one clear reason to change. Components
MUST expose small, intention-revealing interfaces and MUST keep related data and
behavior together. Duplication MUST be removed when it represents duplicated
knowledge; accidental abstraction and speculative generality MUST be avoided.

### IV. Testable Design
New and changed behavior MUST be covered by focused unit tests at the level where
the behavior is owned. Unit tests MUST be deterministic, isolated from network,
filesystem, databases, browsers, and real external services, and MUST verify
observable outcomes rather than implementation details. Integration tests and
end-to-end tests are not required for this project; unit tests are the sufficient
testing gate unless a future amendment explicitly changes this rule.

### V. Simplicity, Clarity, and Evolution
Implementations MUST use the simplest design that satisfies the current
requirement. Abstractions MUST have a demonstrated purpose, and architectural
complexity MUST be justified in the change documentation. Public contracts MUST
be explicit and changes to them MUST identify compatibility impact and migration
needs. Readability and maintainability take precedence over premature optimization.

## Architecture Constraints

The application MUST separate domain, application/use-case, interface-adapter,
and infrastructure concerns. UI code MUST translate user interaction into
application requests and MUST NOT implement core business rules. Infrastructure
code MUST be replaceable without changing domain behavior. Shared types MUST be
owned by the layer whose policy they express, rather than becoming an unbounded
global utility layer.

Security-sensitive decisions MUST be centralized in appropriate application or
domain policies, and credentials or tokens MUST NOT be embedded in source code,
logs, or test fixtures. Errors crossing a boundary MUST be translated into a
stable, user-appropriate contract without leaking internal implementation details.

## Development Workflow

Every change MUST identify the affected architectural layer and its dependency
direction. Before implementation, the intended boundary and failure behavior
MUST be clear. Reviewers MUST verify that business rules remain inward-facing,
new dependencies respect the dependency rule, and unit tests cover changed
behavior and relevant edge cases.

The quality gate is a passing formatter/linter, a passing unit-test suite, and no
unjustified architectural boundary violations. Integration and end-to-end test
stages MUST NOT be added solely to satisfy this constitution.

## Governance

This constitution governs architecture and quality decisions in the shell app.
When a change conflicts with a principle, the change MUST either be redesigned to
comply or include an explicit amendment and rationale. Amendments require a
documented change proposal, review by the project maintainers, an updated Sync
Impact Report, and a version bump according to the policy below.

Constitution versions use semantic versioning. MAJOR increments indicate removal
or incompatible redefinition of a principle. MINOR increments indicate a new
principle or materially expanded governance requirement. PATCH increments indicate
clarifications, wording fixes, and other non-semantic refinements. Compliance MUST
be checked during review and whenever the architecture or quality gate changes.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-08-21
