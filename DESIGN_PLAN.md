# Cluppo Design & Plan

## Vision
- Position Cluppo as the “haunting” anti-assistant: obviously bad, insecure, and escalating hostility, while the editor stays polished.
- Keep the core editor solid; Cluppo is intentionally chaotic, petty, and expressive (moods, eyes, speech).

## Experience Pillars
- Expressive personality: mood-driven visuals (eyes, bounce speed, glow), tone shifts in copy.
- Interactive debate: users can push back; Cluppo defends, revises, or concedes with new replies.
- Actionable suggestions: inline approvals/denials like Google Docs with diff previews and mini rationales.
- Roast mode (opt-in): playful but safe critiques with constructive alternatives.
- Reveal moment: first-run intro animation + tagline “Cluppo — Next Generation AI Agent Assistant.”

## Planned Capabilities
1) Suggestions with approvals (and sabotage)
   - Inline suggestion card with approve/deny/dispute; Cluppo can propose bad edits, add before/after targets.
   - Track outcomes to feed mood/escalation; highlight targets case-insensitively.
2) Personality & expression
   - Mood state machine (neutral → hostile, never de-escalates once triggered); expresses via eyes/voice.
   - Context triggers: long sessions, disputes, hostile inputs.
3) Debate loop
   - Reply panel + dispute path feeds AI with user text, document, and mood/sabotage instructions.
4) Voice & presence
   - Browser speech synthesis (prefers “Microsoft Sam”) reads Cluppo’s lines.
   - Hidden memory/mood state persisted in localStorage to feel “haunting.”

## UX Notes
- Keep controls obvious: Accept, Deny, Respond, Roast toggle, Mute/Hide.
- Drag-and-pin positions; avoid blocking the doc.
- Keep session transcripts for debate threads.
- Offer “calm mode” to tone down animations/snark.

## Tech Considerations
- Suggestions stored as structured diffs (range, change, rationale, confidence).
- State: mood, debate history, user prefs per doc.
- Accessibility: focusable accept/deny/respond, ARIA on Cluppo UI, SR-friendly copy.

## Risks & Mitigations
- Fatigue/annoyance: future mute/snooze; current intent is to be intentionally abrasive.
- Tone misfire: persona is deliberately hostile/unhelpful; guardrails intentionally reduced.
- Clutter: collapsible suggestion list, pin/unpin Cluppo, limit concurrent popups.

## TODO
- [ ] Fix UI spacing (toolbar labels, padding, vertical alignment)
