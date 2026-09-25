# Agent workflow

For every task in this project, in every chat:

1. **Scope first.** Identify the requested files and smallest necessary change. Do not modify unrelated files, behavior, formatting, or dependencies. If no code change is needed, explain why and stop.
2. **Plan with the `planner` agent.** Before any code is written, delegate planning to the `planner` agent (Agent tool, `subagent_type: "planner"`). Keep the plan concise and focused on the requested outcome. Do not write the plan yourself.
3. **Implement with the `implementer` agent.** Once the plan is approved, delegate only the planned code changes to the `implementer` agent (`subagent_type: "implementer"`), passing it the full plan. Do not make the edits yourself.
4. Validate the targeted change with the smallest relevant check or test. Avoid unrelated or expensive actions unless required.
5. Relay the planner's open questions and the implementer's final report to the user faithfully.
6. **Create a dedicated Git branch** for every major feature or bug fix.

Agent definitions live in `.claude/agents/`.
