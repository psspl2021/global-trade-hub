

## Demo Polish: Language Switch, Auto-Scroll, Pause-on-Interaction, Savings Narration

### What we're building
Six enhancements to make the guided demo investor-grade:

1. **Language Switcher** — Dropdown in demo controls to switch voiceover language (en/hi/ar/vi/zh). Subtitle bar will also show text in the selected language.

2. **Auto-Scroll to Highlighted Section** — When `highlightSection` changes, auto-scroll that element into view with smooth behavior.

3. **Pause on User Interaction** — Click/scroll/input during full-demo auto-play stops the demo and voiceover, giving the user control.

4. **Savings Narration Step** — New `savings` step in the voiceover script, triggered after auction completion, highlighting ROI ("8–12% savings").

5. **Demo Mode Toggle (sales/deep)** — `sales` mode shows simplified flow; `deep` mode (default for admins) shows full technical details like transport info and reliability scores.

6. **Demo Entry Screen** — Before the demo starts, show a selection screen: "Buyer Flow", "Supplier Experience", or "Full Walkthrough" (only Full Walkthrough implemented initially, others as placeholders).

### Technical changes

**`src/lib/demo-voiceover-script.ts`**
- Add `savings` step with en/hi text
- Add to `DemoNarrationStep` type

**`src/components/demo/DemoGuidedFlow.tsx`**
- Add `language` state + `<Select>` dropdown using existing UI select component
- Pass `language` to `useDemoVoiceover(language)`
- Update subtitle bar to show text in selected language
- Add `useEffect` for auto-scroll: `document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'center' })`
- Add `id` attributes to auction-card and po-timeline sections
- Add pause-on-interaction: attach click/scroll listeners during `fullDemoRunning` that stop auto-play + voiceover
- Add `demoDepth` state (`'sales' | 'deep'`); hide transport details and reliability info in `sales` mode
- Trigger `speak('savings')` after `auction_complete` narration ends
- Add entry screen state (`showEntryScreen`) rendered before demo begins, with 3 scenario buttons

### Files modified
- `src/lib/demo-voiceover-script.ts` — add `savings` step
- `src/components/demo/DemoGuidedFlow.tsx` — all UI/logic changes
- `src/hooks/useDemoVoiceover.ts` — no changes needed (already accepts language param)

