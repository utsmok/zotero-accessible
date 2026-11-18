# Zotero for low vision (tunnel vision)

A Zotero setup for a researcher with a visual field of about 4 degrees (tunnel vision) and disturbed light perception. She works on an iMac with a trackpad, rarely uses keyboard shortcuts, and uses an iPad when away from her desk.

Everything here targets **Zotero 10** (the current release, November 2026) and the Zotero Connector. The verdicts below come from Zotero documentation, the Zotero forums, and the Zotero 10 source code; links at the bottom. The plugin was tested on a live Zotero 10 instance (see "Testing").

## For her: one download instead of manual setup

Most of the setup is packaged as a small plugin. She downloads one file and installs it through Zotero's Plugins window. The changes apply immediately:

- Much larger text: `fontSize` 1.7 (70% above the default) and note text at 24 px.
- High-contrast colors: solid black text, visible borders, a black selected row with white text, a dashed outline on the row under the pointer, and a thick keyboard focus ring.
- Only the Title, Creator, and Year columns in the item list, and item details that hide empty fields.
- The four numbered collections. Every browser save lands in **00 Inbox** and gets the tag "To read".
- Three colored status tags with number keys and big toolbar buttons, and whole-row color tinting for tagged items.
- Opening a PDF or web snapshot moves its item from "To read" to "Reading"; a **Mark as Read** button in the reader toolbar sets "Read".
- A large confirmation message in the middle of the item list (or window) for every tag change and save. Zotero's own notices sit in corners, outside a 4-degree field.
- PDFs and web snapshots open in Reading Mode with a sans-serif font, 1.6 line spacing, and a narrow column. `Cmd/Ctrl+Shift+M` toggles it.
- A **Focus view** button (`Cmd/Ctrl+Shift+H`) that hides the collections and item panes together.
- The "To read" saved search, and automatic tagging turned off.
- Optional, in the View menu: low-glare cream colors for the app and the reader (off by default, because white gives the highest contrast), and showing empty fields.

Links:

- Instructions page (for her): https://utsmok.github.io/zotero-accessible/
- Download (stable link): https://github.com/utsmok/zotero-accessible/releases/latest/download/zotero-accessible-setup.xpi
- Releases: https://github.com/utsmok/zotero-accessible/releases

Each setup step runs once, guarded by the `extensions.zotero.accessiblesetup.level` preference, and never overrides changes made afterwards in Settings. Older installs get the new steps when they update. The instructions page also carries the printable cheat sheet.

## What each request needs

| Request | Verdict | How |
| --- | --- | --- |
| High contrast, but NOT dark mode | Yes | Zotero follows the macOS appearance, so keep the Mac in Light mode. Zotero's light theme uses softened grays (main text at 85% black, borders at 15%); the plugin's `style.css` replaces them with solid black and visible borders. macOS "Increase contrast" adds more. |
| Larger font and comfortable spacing | Yes, automated | The plugin sets `fontSize` to 1.7, above the 1.5 maximum of View > Font Size, and the note font to 24 px. Item rows grow with the font, and the default Comfortable density keeps extra padding. |
| Only a few columns (author, title, year) | Yes, automated | The plugin hides every column except Title, Creator, and Year, the same as unticking them in the column header menu. |
| Hide a pane when it is not needed | Yes | View > Layout > Collections Pane / Item Pane / Tag Selector. Zotero has no keyboard shortcut for these toggles. |
| Printed keyboard shortcuts at 18 pt | Yes | `docs/keyboard-shortcuts.html`, linked from the instructions page; the page prints at 18 pt. |
| Written-out key sequences for common tasks | Yes | Same page, section "Recipes": saving an article, weekly Inbox sorting (including adding to a collection), tagging, reading a PDF, citing in Word. |
| Every save lands in an Inbox first | Yes, automated (Mac) | The connector normally saves into whatever is selected in the Zotero window; a fixed default is an open feature request. The plugin makes 00 Inbox the default target for My Library. She can still pick another collection in the connector popup. Items saved while Zotero is closed go to the online library and appear under **Unfiled Items**. On the iPad, she picks 00 Inbox in the Share screen. |
| Few top-level collections, max 2 levels | Yes | Collections behave like playlists: an item can sit in several. A flat, numbered top level is enough. |
| Short tag list | Yes | Automatic tagging is turned off. Three colored tags from Zotero's palette: To read (red), Reading (orange), Read (green). Number keys 1, 2, and 3 add or remove them. |
| Where do search strings live? | Yes | Saved searches in the left pane work like smart folders; the plugin creates "To read". Zotero 10 also runs advanced searches over any view without saving them. |
| Zotero browser connector | Yes | Safari's connector ships with Zotero and is turned on in Safari's Extensions settings; Chrome, Firefox, and Edge get it from zotero.org/download. |
| Automatic, consistent PDF renaming | Yes, on by default | Settings > General > "Automatically rename attachment files using parent metadata" is on by default in Zotero 10. The default template produces `Author - Year - Title.pdf`, and filenames follow later metadata edits. |
| Backup and synchronization | Yes | Data sync (metadata, notes, tags) is free with no size limit. Attachment files need Zotero Storage (300 MB free, paid plans) or WebDAV. Zotero also keeps automatic database backups, but the safety net is sync plus Time Machine. Never place the Zotero data folder inside a cloud-sync folder; that is a documented corruption risk. |
| iPad workflow | Yes | Zotero for iOS syncs the library, reads and annotates PDFs, and saves from Safari and other apps with the Share button. |

## Two Zotero 9 and 10 features that help with tunnel vision

- **Reading Mode (Zotero 10):** shows a PDF as one clean column of reflowable text with adjustable font, size, and line spacing. There is no multi-column page layout to steer through in a 4-degree field. Zotero ships it with a toolbar button only; the plugin adds `Cmd+Shift+M`.
- **Read Aloud (Zotero 9, improved in 10):** reads PDFs, EPUBs, and snapshots aloud, highlights the sentence being read, and syncs the reading position. `Cmd+Shift+L` (or `Cmd+Shift+R`) starts it; `Space` pauses.

## Manual setup without the plugin

Use these steps if the plugin can't be installed:

1. Install Zotero 10 and sign in; create the zotero.org account when prompted.
2. Turn on syncing in Settings > **Account**. Enable data sync; for PDFs, enable file sync.
3. macOS: System Settings > Appearance > **Light**; Accessibility > **Increase contrast** on.
4. In Zotero: View > Font Size > Bigger until text is comfortable. Leave density at Comfortable.
5. Columns: right-click the item list header; keep only Title, Creator, Year.
6. Create the collections `00 Inbox`, `01 Method`, `02 Topic X`, and `03 Topic Y`, and keep them flat.
7. Tags: untick automatic tagging (Settings > General). Create `To read`, `Reading`, and `Read`, and assign colors in that order (right-click in the tag list > Assign Color).
8. High-contrast stylesheet: follow the header inside `files/userChrome.css`.
9. Install the Zotero Connector. Without the plugin, the connector saves to the selected collection, so keep 00 Inbox selected.

## What is not possible today

1. **Pin the save destination when Zotero is closed or on the iPad.** The plugin can only redirect saves that go through the running Mac app.
2. **Native keyboard shortcuts for pane toggles.** Zotero has none; the plugin's Focus view (`Cmd+Shift+H`) hides both side panes at once, and View > Layout still toggles them one by one.
3. **A built-in high-contrast theme.** Zotero has light and dark only. The plugin's stylesheet overrides Zotero's CSS variables, which are not a stable interface; re-check the look after major Zotero upgrades.

## Recommended companion plugin

[Linter for Zotero](https://github.com/northword/zotero-format-metadata) (v4.0.6, built for Zotero 10) lints each saved item: sentence-case titles, normal capitalization for ALL-CAPS author and journal names, DOI lookup that writes only on a unique Crossref match, and removal of placeholder values. Consistent word shapes matter for her because she reads a few words per glance. It is linked from the instructions page rather than bundled: it is AGPL, and its rules are maintained upstream. When you set it up for her, set its "Update Metadata" tool to blank fields only, because its default mode overwrites existing fields.

## Files

- `plugin/`: the setup plugin (`bootstrap.js`, `accessible-setup.js`, `style.css`, `manifest.json`, `updates.json`) and `build.sh`.
- `files/userChrome.css`: the high-contrast overrides and row tint as a manual profile stylesheet, for setups without the plugin.
- `docs/`: the instructions page and the printable cheat sheet, served by GitHub Pages.

## Releasing a new version

1. Bump `version` in `plugin/manifest.json`, and add the same version to `plugin/updates.json` with `update_link` `https://github.com/utsmok/zotero-accessible/releases/download/vX.Y.Z/zotero-accessible-setup.xpi`.
2. If the release adds setup steps, bump `SETUP_LEVEL` in `accessible-setup.js` and add an `if (level < N)` block.
3. Run `plugin/build.sh`, which writes `dist/zotero-accessible-setup.xpi`.
4. Run `gh release create vX.Y.Z dist/zotero-accessible-setup.xpi`, then push `main`. Installed copies pick up the update from `updates.json` on `main`.

Zotero rejects plugin manifests without `applications.zotero.update_url` and `strict_max_version`. The manifest allows Zotero 7 to 10; bump `strict_max_version` when Zotero 11 ships.

## Implementation notes

The plugin uses a few Zotero internals, so re-test it after major Zotero updates:

- The Inbox default wraps `Zotero.Server.Connector.getSaveTarget`; the original is restored when the plugin is disabled.
- New Inbox items get "To read" as an automatic tag (type 1), because the connector's save session rewrites manual tags when she edits the popup but keeps automatic ones. A side effect: Zotero's "Delete Automatic Tags in This Library" would remove these "To read" tags.
- Tag button and number-key feedback wraps `Zotero.Tags.toggleItemsListTags`, the function Zotero's 1 to 9 keys call.
- Columns are set through `ZoteroPane.itemsView.tree._columns.toggleHidden`, the same call the column menu uses, followed by fixed widths, because unhiding columns before layout can leave the Year column as wide as the window.
- Reading Mode is switched on through `reader._internalReader._handleReadingModeEnabledChange`, the toolbar button's handler, on the `tab` notifier's `add` or `load` event. `Zotero.SDT.getPack` is checked first so documents Zotero can't reflow stay as they are without an error banner. The reflow view ignores `reader.ebookFontFamily`, so the plugin sets the font on it, and sets line height and page width through `_handleAppearanceChange` with `Cu.cloneInto`, because the reader runs in its own compartment. `Cmd+Shift+R`, `Cmd+Shift+L`, and `Cmd+Shift+F` are taken in Zotero 10 (Read Aloud, advanced search), so the plugin uses `M` and `H`.
- The **Mark as Read** button uses `Zotero.Reader.registerEventListener('renderToolbar', …)`.
- The row tint is a generated `<style>` with one rule per tag color, rebuilt when tag colors change. It skips selected rows, and it uses `!important` to beat Zotero's striped-row rule. Tag colors come from Zotero's palette; other colors show as black dots in the tag list.
- Low-glare mode overrides Zotero's background variables and creates a reader theme "Low glare" (cream `#f5efe0`, black text) in the synced `readerCustomThemes` setting.
- The stylesheet URL carries the plugin version, because Gecko keeps serving a cached stylesheet for the same URL after an in-place plugin update.

## Testing

Plugin 1.2.0 was tested on a live headless Zotero 10.0.8 (Linux build), with screenshots and state read through the remote debugger:

- Installed through `AddonManager.getInstallForFile`, the same path as Install Plugin From File. Collections, saved search, tags, columns, font sizes, and `automaticTags` were all applied.
- A real `POST /connector/saveItems` while another view was selected landed in 00 Inbox with the tag "To read", and the tag survived a later `/connector/updateSession` that added another tag. A centered message confirmed the save.
- Tag buttons and `toggleItemsListTags` showed centered messages; tagged rows were tinted, and the selected row was black with white text.
- Opening a PDF and a web snapshot moved "To read" to "Reading" and switched on Reading Mode with Verdana, line height 1.6, and the narrow column. `Ctrl+Shift+M` switched it off and on again. **Mark as Read** set "Read".
- Focus view hid and restored both panes; column widths stayed the same. Low-glare mode switched the backgrounds and the reader theme.
- Item details showed only filled fields (Item Type, Title, Author, Date, and the dates added and modified).
- Upgrade from level 2 ran only the level 3 steps. Upgrade from 1.0.1 and restart persistence were tested for 1.1.0.

Not tested here: the macOS build, the Safari and Chrome connectors themselves, sync, the iPad app, and the `updates.json` auto-update flow.

## Sources

- Zotero accessibility statement and WCAG 2.2 AA conformance (VPAT, October 2024): https://www.zotero.org/accessibility
- Font size in the View menu: https://www.zotero.org/support/kb/font_size
- Collections, tags, colored tags, saved searches: https://www.zotero.org/support/collections_and_tags
- File renaming and template syntax: https://www.zotero.org/support/file_renaming
- Connector preferences: https://www.zotero.org/support/connector_preferences
- Connector saves to the selected collection; default-destination feature request (January 2026, answered by the Zotero team February 2026): https://forums.zotero.org/discussion/129439/
- Sync: https://www.zotero.org/support/sync
- Data directory, automatic backups, cloud-folder warning: https://www.zotero.org/support/zotero_data
- Zotero for iOS: https://www.zotero.org/support/ios
- Keyboard shortcuts: https://www.zotero.org/support/kb/keyboard_shortcuts
- Profile directory (where `userChrome.css` goes): https://www.zotero.org/support/kb/profile_directory
- Zotero 10 changelog (Reading Mode, Read Aloud shortcut `Cmd/Ctrl-Shift-L/R`, advanced search, Account pane, Safari connector): https://www.zotero.org/support/10.0_changelog
- Zotero 9 announcement (Read Aloud, Recently Read): https://www.zotero.org/blog/zotero-9/
- Pane toggles in View > Layout: https://forums.zotero.org/discussion/124064/
