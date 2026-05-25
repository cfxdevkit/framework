ts
// Before (error)
if ((match = fenceRe.exec(content)) !== null) { ... }

// After (safe)
const match = fenceRe.exec(content);
if (match !== null) { ... }
