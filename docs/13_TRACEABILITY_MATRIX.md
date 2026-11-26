# 13 — Requirements Traceability Matrix

| Requirement | Story | Rule / specification | Screen/module | Test |
|---|---|---|---|---|
| FR-001 Google authentication | US-001 | OAuth in Architecture | S-01 Auth | T-AUTH-* |
| FR-002 Create private squad | US-002 | BR-08 | S-02/S-03 | T-SQ-01 |
| FR-003 Secure invite | US-003/004 | BR-09 | S-03/S-04 | T-INV-01..06 |
| FR-004 Private member feed | US-005 | BR-08, BR-17 | S-05 | T-RLS-01..04 |
| FR-005 Manual campus state | US-006 | BR-01, BR-02, BR-06 | S-06 | T-BR-05, T-PRES-01 |
| FR-006 Availability | US-007 | BR-01..04, BR-13 | S-06 | T-BR-01..03 |
| FR-007 Zone selection | US-008 | BR-03, BR-11 | S-07 | T-BR-09, T-BR-10 |
| FR-008 Ghost Mode | US-009/010 | BR-05 | S-05/S-08 | T-BR-06/07, T-RLS-08 |
| FR-009 Leave/remove squad | US-011/012 | BR-08 | S-08/S-09 | T-SQ-02/03 |
| FR-010 Freshness/offline | US-013 | BR-04, BR-07, BR-16 | S-05/S-10 | T-BR-04, T-UX-* |
| FR-011 Realtime | US-005 | Architecture Realtime section | S-05 | T-RT-01 |
| FR-012 Android push | US-014 | BR-14/15 | S-08 | T-PUSH-* |
| FR-013 Android geofencing | US-015/016/017 | Location spec | S-08/native plugin | T-GEO-* |
| FR-014 PWA | US-018 | Platform differences | App shell | T-PWA-* |
| NFR-001 No charge | — | ADR-020; zero-cost guide | Deployment | T-COST-01 |
| NFR-002 Privacy minimisation | — | BR-05, BR-12, BR-17 | All modules | T-PRIV-* |
| NFR-003 Authorization | — | BR-08; DB spec RLS | Supabase | T-RLS-* |
| NFR-004 Responsive | — | Screens/design system | All screens | T-UX-* |
| NFR-005 Maintainability | — | AGENTS.md / architecture | Repo | PR review |

### Traceability maintenance
When changing a business rule, update the decision register, story/business rule, relevant database/API contract, this matrix and test. AI-generated changes are not accepted if they change behaviour without updating this chain.
