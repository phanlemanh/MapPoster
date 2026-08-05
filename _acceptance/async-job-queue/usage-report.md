### S3 execute-parallel — wf_791b4592-666 (2 agent, 23,790 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| exec:task-1 | claude-opus-5 | 28 | 13,078 | 56 | 2,249,818 | 240 |
| exec:task-2 | claude-opus-5 | 20 | 10,712 | 40 | 1,877,329 | 204 |

- **claude-opus-5**: 2 agent · 48 calls · out 23,790 · in 96 · cache_read 4,127,147 · cache_create 200,130

### S4 round 3 (PASS) — wf_30a03e74-07e (32 agent, 132,411 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5 | 25 | 26,450 | 50 | 2,615,427 | 470 |
| review:conventions | claude-opus-5 | 12 | 16,755 | 3,629 | 1,014,936 | 311 |
| refute:http.ts | claude-sonnet-5 | 19 | 9,178 | 38 | 1,496,520 | 233 |
| refute:jobRunner.ts | claude-sonnet-5 | 23 | 8,838 | 46 | 2,021,404 | 241 |
| refute:jobRunner.ts | claude-sonnet-5 | 12 | 6,778 | 287 | 936,768 | 137 |
| refute:http.ts | claude-sonnet-5 | 18 | 6,751 | 36 | 1,438,892 | 205 |
| refute:jobRunner.ts | claude-sonnet-5 | 16 | 6,474 | 32 | 1,254,965 | 205 |
| refute:config.yaml | claude-sonnet-5 | 17 | 6,093 | 34 | 1,373,962 | 256 |
| refute:jobRunner.ts | claude-sonnet-5 | 10 | 5,553 | 3,170 | 722,236 | 121 |
| baseline:diffBase | claude-sonnet-5 | 20 | 5,415 | 40 | 1,395,942 | 153 |
| refute:jobStore.ts | claude-sonnet-5 | 9 | 4,331 | 18 | 627,028 | 92 |
| refute:http.ts | claude-sonnet-5 | 4 | 4,302 | 8 | 203,198 | 90 |
| refute:http.ts | claude-sonnet-5 | 17 | 3,821 | 90 | 1,286,692 | 134 |
| refute:http.ts | claude-sonnet-5 | 14 | 3,267 | 272 | 1,040,782 | 139 |
| refute:README.md | claude-sonnet-5 | 18 | 3,102 | 36 | 1,403,391 | 142 |
| refute:jobStore.ts | claude-sonnet-5 | 9 | 2,414 | 18 | 614,590 | 69 |
| refute:http.ts | claude-sonnet-5 | 9 | 2,244 | 18 | 620,862 | 58 |
| refute:jobRunner.ts | claude-sonnet-5 | 9 | 1,993 | 18 | 609,385 | 84 |
| refute:http.ts | claude-sonnet-5 | 6 | 1,986 | 12 | 383,347 | 46 |
| synthesize:report | claude-sonnet-5 | 7 | 923 | 14 | 564,228 | 272 |
| machine:npm run test:e2e && npm run test:mcp | claude-haiku-4-5-20251001 | 2 | 848 | 18 | 44,199 | 110 |
| capture:provenance | claude-sonnet-5 | 2 | 691 | 4 | 63,525 | 17 |
| machine:npx vitest run mcp-server/src/jobRunner. | claude-haiku-4-5-20251001 | 2 | 683 | 18 | 44,203 | 15 |
| machine:npx vitest run mcp-server/src/http.test. | claude-haiku-4-5-20251001 | 2 | 671 | 18 | 44,203 | 16 |
| machine:npx vitest run mcp-server/src/tools.test | claude-haiku-4-5-20251001 | 2 | 623 | 18 | 44,203 | 14 |
| judge:E20:domain-correctness | claude-sonnet-5 | 5 | 515 | 10 | 329,150 | 158 |
| judge:E20:spec-alignment | claude-sonnet-5 | 2 | 349 | 4 | 63,761 | 81 |
| judge:E20:operational-feasibility | claude-sonnet-5 | 2 | 343 | 4 | 63,763 | 88 |
| machine:npx vitest run mcp-server/src/motionComp | claude-haiku-4-5-20251001 | 2 | 317 | 18 | 44,207 | 15 |
| machine:npx vitest run mcp-server/src/jobStore.t | claude-haiku-4-5-20251001 | 2 | 296 | 18 | 44,205 | 18 |
| machine:npm test | claude-haiku-4-5-20251001 | 2 | 291 | 18 | 44,175 | 17 |
| triage | claude-sonnet-5 | 2 | 116 | 4 | 70,859 | 126 |

- **claude-opus-5**: 2 agent · 37 calls · out 43,205 · in 3,679 · cache_read 3,630,363 · cache_create 243,809
- **claude-sonnet-5**: 23 agent · 250 calls · out 85,477 · in 4,213 · cache_read 18,585,250 · cache_create 1,859,999
- **claude-haiku-4-5-20251001**: 7 agent · 14 calls · out 3,729 · in 126 · cache_read 309,395 · cache_create 330,926

