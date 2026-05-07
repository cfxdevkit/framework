---
"@cfxdevkit/devnode": patch
---

Fix port cleanup on startup failure by stopping the server and releasing ports when an error occurs after partial initialization.
