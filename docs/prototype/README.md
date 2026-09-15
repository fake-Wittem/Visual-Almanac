# Collector’s Cabinet — integrated UI

Selected visual target: [selected-cabinet.png](selected-cabinet.png), the third displayed concept.

## Run

From the project root, `npm run dev`. The development URL is printed by Vite when started; the preview is currently stopped.

## Pages and interactions

- `/`: entrance with eight archive folders, selection arrows, keyboard Left/Right, touch swipe and horizontal trackpad wheel. Vertical scroll retains native scrolling and reveals the collection index. The selected folder opens its collection.
- `/catalog`: all 120 existing records; eight categories, text search, advanced tag filters, sorting, pagination and exhibition/list view.
- `/styles/:id`: dossier-style reading surface, image viewer, palettes and copy actions, observations, history and related styles.
- `/favorites`: existing browser-local favorites, including empty state and undo after removal.
- Global navigation: persistent edge bookmarks, whole-library searchable directory dialog, Escape dismissal and focus restoration.
- Reduced-motion preference disables animated transitions; small screens use a single prominent folder and bottom navigation.

Existing record IDs, taxonomy, source notes and poster files remain the content source. Old `/?category=...` and other catalogue query links redirect to `/catalog` with their queries preserved. Existing detail URLs and saved favorite IDs remain valid.

## Implementation

The prototype is integrated into the existing Vue application. No new scaffold or server framework was needed.

- `src/pages/CabinetHome.vue`: selected folder state, keyboard/touch/wheel gestures, entrance transition and scroll reveal.
- `src/components/cabinet/collections.ts`: presentation order and exhibition artwork, independent of the existing taxonomy IDs.
- `src/components/cabinet/ArchiveRecord.vue`: archive-folder display for real records.
- `src/styles/cabinet.css`: shared theme, navigation, catalogue and dossier layouts.
- `src/styles/cabinet/home.css`: hero folders, directory, responsive layout and motion.
- `src/styles/cabinet/records.css`: shared record and palette layout.
- `src/styles/cabinet/back-to-top.css`: global brass return control.
- `src/components/cabinet/RecordPalette.vue`: hover, pinned palette, focus handling and copy controls.

Folder silhouettes, paper fibers, brass grain and collage artworks are real raster assets. Chinese headings, descriptions, counters, navigation and buttons are live HTML. Icon strokes use the existing Lucide library. Folder movement interpolates only translation and uniform scale on a fixed-aspect-ratio folio with one material layer; neighboring folders physically overlap; it does not flatten the screen into a clickable screenshot.

## Assets and generation

All new assets were produced with the built-in ImageGen tool using the selected visual as reference. Generated PNG originals are retained in `assets/cabinet-originals/`; web-ready images live in `public/images/cabinet/`. Transparent folder WebP derivatives preserve native alpha. No image-generation API key or fallback CLI was used.

| Asset             | Prompt / role                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| folder-blank      | Blank portrait cream archival folder, 1107 × 1421 output, top-left index tab, layered thick paper, subtle fibers and worn edges, transparent background, no text or art.  |
| botanical-collage | Antique botanical leaves on the left and Victorian glass conservatory on the right; desaturated forest green and cream printed collage; artwork script retained in image. |
| retro-collage     | Sepia gramophone horn, typed paper collage and vintage wooden detail; portrait, no folder or UI.                                                                          |
| minimal-collage   | Greige paper/concrete planes, large charcoal circle segment, black architectural bench; portrait, monochrome, no text.                                                    |
| eastern-collage   | Antique ink landscape with pine, mountain and river on pale parchment; portrait, no labels.                                                                               |
| classical-collage | Close-up ivory acanthus scroll relief on dark sepia background; portrait, no hall interior or labels.                                                                     |
| paper             | Near-uniform warm archival paper, subtle microscopic fibers, no folds, text or objects.                                                                                   |
| brass             | Subdued antique brushed brass material; no text or objects.                                                                                                               |

The three additional collections reuse the project's existing original scene art for future technology, experimental art and street culture. Supporting generated collages preserve the reference's subjects and material character; they are newly rendered artwork, so individual leaf shapes, carving patterns and paper fibers differ from the concept image.

## Verification

The following results are historical, from earlier UI iterations; they do not validate the subsequent edits or cleanup. As requested, the cleanup ran no tests, typecheck, build or browser checks. See `../UI清理记录.md` for its scope, and the root `design-qa.md` for historical comparison evidence. Screenshots are stored locally in `output/cabinet-qa/` (gitignored). Existing unit tests: 136 passed. Content validation: 120 archives / 120 original posters. Production build and type checks passed. The Vite large-entry-chunk advisory remains: the existing eager content repository places all archive metadata in the main bundle; this is a future optimization rather than a rendering or interaction failure.

Browser verification covers desktop, 834px tablet and 390px mobile layouts. No remote deployment or Git publication was performed.

Desktop hero shows four overlapping folders: previous, selected, and two upcoming. Near folders cover farther folders; secondary content may be obscured. The smallest visible folder is 82% of the main size, and the right stack stays inside the stage.
