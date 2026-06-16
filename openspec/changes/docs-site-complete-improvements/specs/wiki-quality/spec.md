## ADDED Requirements

### REQ 4.1: Wiki Content Condensation
When `sync:wiki` is run, the pipeline MUST post-process each wiki page through `condenseWikiContent()`.

The post-processing MUST:
- Keep the H1 heading as-is
- Condense the first 200 words into a single paragraph
- Remove any section titled "Integration with Codebase" (including all subsections)
- Remove any sentence containing "The module contains no executable code"
- Keep sections titled "Configuration Files", "Package Layout", and "Key Files"

### REQ 4.2: Wiki Quality Threshold
After post-processing, wiki pages MUST meet these quality thresholds:
- Maximum 15 content lines (excluding frontmatter, mermaid diagrams, and code blocks)
- First paragraph MUST be a single coherent overview
- No boilerplate sentences about "no executable code" or "purely configurational"

### REQ 4.3: Preserve Existing Processing
Post-processing MUST NOT break existing transformations:
- Mermaid diagrams MUST still be converted to `<Mermaid>` components
- Special characters in node labels MUST still be quoted
- Oversized diagrams MUST still be simplified (≤30 lines)
- `@{link ...}` patterns MUST still be converted to backtick references

### REQ 4.4: CLI Integration
Post-processing MUST run automatically during `sync wiki` and `sync all`. No separate CLI command is needed.
