# @cfxdevkit/cdk-ai

Private facade package for the repository AI stack.

It currently re-exports the PI runtime surface from `@cfxdevkit/pi-agent`
and the repo automation surface from `@cfxdevkit/llm-agents` so callers can
move toward a single package boundary before deeper restructuring.