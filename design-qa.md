> Status note: This is historical QA evidence. Later UI edits and the code cleanup were not tested or browser-verified, at the user's explicit request. Earlier “passed” entries do not certify the current working tree. See docs/UI清理记录.md.

# Folder switching follow-up QA

final result: passed

## Scope and target

September 15 browser comments 1–2, natural-organic selected at 1329 × 920: remove width compression, displaced content and double-material ghosting. The requested physical overlap supersedes the previous narrow-folder geometry. This report supersedes the earlier geometry QA.

## Changes

- One wide paper material per folder; removed narrow material and crossfade.
- Constant 1107:1421 aspect ratio, fixed base dimensions at each breakpoint, uniform scale and translation only.
- Identical internal typography and artwork placement across slots. Real stacking supplies the occlusion.
- Reduced-motion mode disables the transition.

## Browser evidence

- Viewed the supplied annotated reference alongside the current natural-organic desktop state. Also compared the prior implementation screenshot with the new capture. Paper, botanical collage and primary CTA remain intact; rear folders now retain full proportions behind adjacent paper.
- output/cabinet-qa/uniform-desktop.jpg: 1329 × 920 capture.
- output/cabinet-qa/uniform-mobile.jpg: 390 × 844 capture; no horizontal overflow (375px content and scroll width).
- output/cabinet-qa/uniform-motion.json: eight live samples during arrow navigation. All eight folders retain base dimensions 478.797 × 614.594px and one material. Sampled intermediate matrices have equal X/Y scale, including 0.872604, 0.885286 and 0.909815. Inspected a visible intermediate frame: no crossfaded second silhouette.
- Arrow navigation and direct ruler selection exercised. Browser error/warning log empty.
- npm run build passed: content validation, derivative images, typecheck and Vite build. Existing bundle-size advisory remains.

## Limitations

The side folders intentionally have partially covered content. This scoped pass checks the reported hero defects and mobile layout; it does not repeat the earlier whole-app flow audit.

## Subsequent stacking correction

final result: passed

User annotation requires near folders to cover farther folders, permits obscured secondary content, and requests one fewer folder. Desktop now shows four folders total (previous, selected, two next). Right slots use x=44/60cqw, scales .86/.82 and descending z-index 7/6 beneath the selected folder (20). Hidden slots originate behind the last visible folder, within the stage.

At 1329 × 920, all four visible bounding boxes are within the stage; the last right edge is 1148.61px, leaving space before navigation. The smallest visible folder retains 82% scale. Visually checked initial natural-organic state against the supplied annotated state and checked next/previous navigation. Screenshot: output/cabinet-qa/stack-desktop.jpg. Single-material, uniform-scale behavior retained. npm run build passed, including typecheck and content validation; existing bundle-size advisory remains. This supersedes the prior right-hand stacking arrangement.

## Secondary readability and reverse entry follow-up

final result: passed

At the user's 1329 × 920 viewport with Retro selected, visually checked Natural & Organic in the first right slot against the supplied annotation. Its Chinese title, English subtitle and main description are fully exposed. Slot 1 moves to 53cqw, slot 2 to 64cqw; maximum visible right edge is 1199.01px inside the 1260px stage. Four-folder depth ordering and uniform scale remain intact. Screenshot: output/cabinet-qa/readable-secondary.jpg.

Reverse entry now reserves a signed -2 slot on the left; hidden folders reposition without animation, then animate into the visible -1 slot. Ten live DOM samples show the new Street & Pop folder entering from x=-340.2 through -301.65, -262.92, -224.65 and -188.00, rather than traversing from the right. Evidence: output/cabinet-qa/left-entry.json. Previous-button navigation across the beginning of the collection was exercised. Build, content validation and typecheck passed; existing bundle-size advisory remains.

## Catalogue palette and card alignment follow-up

final result: passed

Replaced native title attributes on tiny swatches with a 44px-high palette trigger and a paper popover containing selectable names/HEX values and individual copy buttons. Pointer entry opens it; clicking pins it for repeated copying. Escape/outside pointer closes it. Focus can enter its controls. A short hover-exit delay bridges pointer movement to the panel. Popup does not affect document layout.

Fixed title and two-line summary slots reserve identical space. At desktop width, all 24 rendered grid cards measure 682.13px high; first six have identical 638.125px palette offsets and 45.594px summary slots. At 390 × 844, tested cards measure 400.61px high; popovers fit the two columns (x=29–179 and x=196–346) without horizontal page overflow. List mode checked with its panel anchored inward. Compared the supplied misaligned first-row evidence with the rendered aligned rows and larger swatches.

Browser exercised click-to-pin, internal copy button, Escape close, outside close, grid/list switching and mobile opening. Copy returned the app status '已复制到剪贴板'. HEX computed user-select is text. Browser warning/error logs empty. Screenshots: output/cabinet-qa/palette-desktop.jpg and palette-mobile.jpg. npm run build passed after final changes (including typecheck and 120-record validation); existing bundle-size advisory remains.
