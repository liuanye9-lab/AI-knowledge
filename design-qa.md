# Design QA · 需求项目台

- Source visual truth: `D:\Ai学习指南\ai-knowledge\images\concepts\demand-project-studio-v1.png`
- Implementation screenshot: `D:\Ai学习指南\ai-knowledge\design-implementation-desktop.png`
- Mobile screenshot: `D:\Ai学习指南\ai-knowledge\design-implementation-mobile.png`
- Desktop viewport: requested `1440 × 1024`, device scale factor 1
- Source pixels: `1488 × 1026`; implementation pixels: `1425 × 1024`（浏览器垂直滚动条占用 15 px；比较时按同一 1440 CSS viewport 判断）
- Mobile viewport: requested `390 × 844`; implementation content viewport `375 × 844`, device scale factor 1
- State: desktop empty-project home; additionally tested generated meeting solution and saved-project state

## Full-view comparison evidence

Source and implementation were opened together at the same desktop viewport. Both use the same left-goal/right-watercolor hero, quiet editorial header, one dominant goal input, six scenario starters, warm paper surface, ink-blue display type, sage action color, and thin-rule grouping. The implementation intentionally uses real empty-project state instead of the mock's fabricated historical projects; after a project is created, that region becomes populated.

## Focused comparison evidence

The 1440 px captures keep hero typography, input, scenario card imagery and navigation readable, so a separate crop was not needed. The solution state was also inspected independently in-browser: it showed the human/Agent role contract, four execution steps, Feishu tool combination, 20% core method, and primary start action without clipping.

## Required fidelity surfaces

- Fonts and typography: Noto Serif SC and Noto Sans SC match the source's editorial Chinese hierarchy. Display heading is a single desktop line and becomes two balanced lines on mobile. Body size, weight and line height remain readable.
- Spacing and layout rhythm: desktop follows the source's wide two-column hero and six-column scenario strip. Mobile collapses to one column with a two-column scenario grid. Thin rules carry grouping; cards do not nest.
- Colors and tokens: warm `#fffefa` paper, ink `#17283a`, sage `#637d68`, faint gray and restrained clay continue the selected concept and the existing product identity. No new decorative gradient was introduced.
- Image quality and asset fidelity: all visible illustrations are raster watercolor assets generated for the product. Hero uses `object-fit: contain`; mobile image bounds stay inside the content viewport. No SVG, CSS drawing, emoji placeholder or stretched image is used for the new interface.
- Copy and content: UI is outcome-led and understandable without AI terminology. It makes the AI-fit judgment, Agent work and human confirmation explicit, while preserving the existing knowledge base as an on-demand reference.

## Primary interactions tested

1. Entered “把周会记录整理成每个人的任务并发到飞书”.
2. Verified the panel selected the meeting scenario, produced four steps, and recommended “飞书妙记 + 飞书文档 + 飞书任务”.
3. Clicked “开始这个项目”.
4. Verified the button changed to “项目已建立” and one active project appeared.
5. Checked browser console warnings/errors after the flow: none from the product page.
6. Checked mobile layout metrics after the final fix: `scrollWidth = viewport width = 375`; hero image bounds `18–357 px`.

## Comparison history

- Earlier P2: desktop title wrapped into two oversized lines and pushed projects below the expected visual rhythm. Fix: reduced desktop display scale, hero height and scenario-card height. Post-fix evidence: final desktop screenshot shows a single-line heading and the project section begins within the first viewport.
- Earlier P2: mobile hero illustration exceeded the content viewport (`scrollWidth 388` vs `viewport 375`). Fix: set mobile hero image to `width/max-width: 100%` with zero horizontal margin and refreshed the stylesheet version. Post-fix evidence: final mobile metrics show `scrollWidth 375`, with image bounds inside the page.

## Findings

No actionable P0, P1 or P2 findings remain.

## Follow-up polish

- P3: replace repeated historical-project empty state with a lightweight first-project example only if user testing shows the empty state is unclear.
- P3: once real Feishu project data is available, add source timestamps and collaboration status without increasing first-screen density.

final result: passed
