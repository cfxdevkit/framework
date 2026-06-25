---
name: openspec-archive-change
description: Archive completed change in experimental workflow. Use when user wants finalize archive change implementation complete.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.3.1"
---

Archive completed change in experimental workflow.

**Input**: Optionally specify change name. If omitted, check if be inferred conversation context. If vague or ambiguous you MUST prompt available changes.

**Steps**

1. **If no change name provided, prompt selection**
   Run `openspec list --json` get available changes. Use **AskUserQuestion tool** let user select.

2. **Validate change status**
   Run `openspec status --change <name>` to verify isComplete is true or all tasks are done.

3. **Create archive directory**
   ```bash
   mkdir -p openspec/changes/archive
   ```

4. **Move change to archive with date prefix**
   ```bash
   mv openspec/changes/<name> openspec/changes/archive/$(date +%Y-%m-%d)-<name>
   ```

5. **Remove branch if it exists**
   ```bash
   git branch -D <name> 2>/dev/null || echo "No branch to delete"
   ```

6. **Update any references to the change**
   Search for references in documentation or configuration files.

7. **Confirm archival**
   Verify the change no longer appears in `openspec list` and exists in `openspec/changes/archive/`.
