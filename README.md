# Zotero for low vision (tunnel vision)

A Zotero setup for a researcher with a visual field of about 4 degrees (tunnel vision) and disturbed light perception. She works on an iMac with a trackpad, rarely uses keyboard shortcuts, and uses an iPad when away from her desk.

Everything here targets **Zotero 10** (the current release, November 2026) and the Zotero Connector. The verdicts below come from Zotero documentation, the Zotero forums, and the Zotero 10 source code; links at the bottom. The stylesheet and the font-size settings were tested on a live Zotero 10 instance (see "Testing").

## What each request needs

| Request | Verdict | How |
| --- | --- | --- |
| High contrast, but NOT dark mode | Yes | Zotero follows the macOS appearance, so keep the Mac in Light mode. Zotero's light theme uses softened grays (main text at 85% black, borders at 15%); `files/userChrome.css` replaces them with solid black and visible borders. macOS "Increase contrast" adds more. |
| Larger font and comfortable spacing | Yes | View > Font Size > Larger (repeat 2 to 4 times; it maps to the `fontSize` setting). Item list rows grow with the font automatically, and the Comfortable density keeps extra padding. Row height is computed from font size and density in Zotero's code, so no manual spacing work is needed. |
| Only a few columns (author, title, year) | Yes | Right-click the column header, untick everything, then tick Title, Creator, and Year. A dedicated Year column exists in the current version. |
| Hide a pane when it is not needed | Yes | View > Layout > Collections Pane / Items Pane / Item Pane / Tag Selector. There is no keyboard shortcut for these toggles (open feature request, see below). |
| Printed keyboard shortcuts at 18 pt | Yes | Open `files/keyboard-shortcuts.html` in a browser and print it; the page is set to 18 pt. |
| Written-out key sequences for common tasks | Yes | Same file, section "Recipes": saving an article, weekly Inbox sorting, tagging, reading a PDF, citing in Word. |
| Every save lands in an Inbox first | Partly | The browser connector always saves into the collection selected in the Zotero window; a fixed default collection is an open feature request (January 2026). The workable habit: keep **00 Inbox** selected in Zotero, and also check **Unfiled Items** during triage, because items saved while Zotero is closed land there. |
| Few top-level collections, max 2 levels | Yes | Collections behave like playlists (an item can sit in several). A flat, numbered top level is enough; no subcollections needed. |
| Short tag list | Yes | Turn off automatic tagging (Settings > General > "Automatically tag items with keywords and subject headings"). Use a small set of colored tags; each one gets a number key (1 to 9) that adds or removes it from selected items. |
| Where do search strings live? | Yes | Saved searches (left pane, like smart folders; example: Tag is not "read" for everything still unread). Zotero 10 additionally runs advanced searches over any view without saving them. |
| Zotero browser connector | Yes | Zotero Connector for Safari, Chrome, Firefox, Edge. The Safari connector gained proxy support in Zotero 10. |
| Automatic, consistent PDF renaming | Yes | Built in since Zotero 7. Settings > General > "Automatically rename attachment files using parent metadata", with a template; the default produces `Author - Year - Title.pdf`. Zotero 8 also keeps filenames in sync when metadata changes. |
| Backup and synchronization | Yes | Data sync (all metadata, notes, tags) is free with no size limit. Attachment files need Zotero Storage (300 MB free, paid plans) or WebDAV. Zotero also keeps automatic daily database backups, but the intended safety net is sync plus Time Machine. Never place the Zotero data folder inside a cloud-sync folder; that is a documented corruption risk. |
| iPad workflow | Yes | Zotero for iOS: syncs the library, reads and annotates PDFs, saves from Safari and other apps via the Share button. |

## Two Zotero 9/10 features that matter specifically for tunnel vision

- **Reading Mode (Zotero 10):** shows a PDF as one clean column of reflowable text with adjustable font, size, and line spacing. No multi-column page layout to steer through in a 4-degree field.
- **Read Aloud (Zotero 9, improved in 10):** reads PDFs, EPUBs, and snapshots aloud in natural voices, follows the sentence being read, and can annotate that sentence with one key. Reading position syncs across devices.

## One-time setup on the iMac

1. Install Zotero 10 and sign in; create the zotero.org account when prompted.
2. Turn on syncing: Settings > **Account** (this pane was called "Sync" before Zotero 10). Enable data sync; for PDFs, enable file sync (Zotero Storage 300 MB free is fine to start).
3. macOS: System Settings > Appearance > **Light**; Accessibility > **Increase contrast** on. Zotero stays light.
4. In Zotero: View > Font Size > Larger two to four times until text is comfortable. Leave density at Comfortable.
5. Columns: right-click the item list header; keep only Title, Creator, Year.
6. Panes: View > Layout; untick Tag Selector for a cleaner left pane. Show panes again the same way.
7. Create the collections: `00 Inbox`, `01 Method`, `02 Topic X`, `03 Topic Y` (numbers keep them at the top; keep it flat).
8. Tags: untick automatic tagging (Settings > General). Create three tags and give them colors (right-click in the tag list > Assign Color): `To read` red position 1, `Reading` yellow position 2, `Read` green position 3. Number keys 1, 2, 3 now apply them.
9. File renaming: Settings > General > tick "Automatically rename attachment files using parent metadata". The default template is fine (`Author - Year - Title`). Tip: the settings window has a search box; type "rename" to find it.
10. High-contrast stylesheet: follow the header inside `files/userChrome.css` (copy it into the profile's `chrome` folder, set `toolkit.legacyUserProfileCustomizations.stylesheets` to true in Settings > Advanced > Config Editor, restart Zotero).
11. Connector: install the Zotero Connector in her browser, and agree to the proxy prompt if the campus uses one.
12. iPad: install Zotero from the App Store, sign in with the same account.

## The daily loop (what to write down for her)

- **Capture:** keep 00 Inbox selected in Zotero; in the browser, click the Zotero button; the popup shows 00 Inbox; done.
- **Triage once a week:** open 00 Inbox (and Unfiled Items), decide per item: drag to a topic collection and press 1 (To read), or press Cmd+Delete to trash it.
- **Read:** double-click an item, zoom with Cmd+plus, try Reading Mode; press Cmd+Shift+L to listen.
- **Cite:** in Word, Zotero tab > Add/Edit Citation.

All of this is on the printable sheet.

## What is not possible today

1. **Pin the connector's save destination** to one collection. The connector uses whatever collection is selected in the Zotero window (confirmed by the Zotero team in February 2026); a fixed default is an open feature request.
2. **Keyboard shortcuts for pane toggles.** View > Layout works with the mouse; shortcut requests are still open. For someone who avoids shortcuts, that is fine; but it should be said.
3. **A built-in high-contrast theme.** Zotero has light and dark only; contrast tuning goes through the stylesheet in this repo. That mechanism is documented, works on Zotero 10, but is not an official extension point, so re-check after major Zotero upgrades.

## Files

- `files/userChrome.css`: high-contrast overrides for Zotero's light theme; install steps in the file header.
- `files/keyboard-shortcuts.html`: printable 18 pt cheat sheet: keys plus the five most common task sequences.

## Testing

Verified on a live headless Zotero 10 (Linux build, November 2026) with screenshots:

- `fontSize` set to 1.35 enlarged all UI text, and item list rows grew with it (comfortable density).
- A `userChrome.css` with a diagnostic background and the variable overrides from this repo loaded and applied with `toolkit.legacyUserProfileCustomizations.stylesheets = true`.
- Test items were injected through the local API to confirm real rows, title truncation, and the colored tag appearing in the tag selector.

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
- Zotero 10 changelog (Reading Mode, advanced search, Account pane, Safari connector, Read Aloud shortcut): https://www.zotero.org/support/10.0_changelog
- Zotero 9 announcement (Read Aloud, Recently Read): https://www.zotero.org/blog/zotero-9/
- Pane toggles in View > Layout: https://forums.zotero.org/discussion/124064/
- Row height computed from font size and density (source): `chrome/content/zotero/components/virtualized-table.jsx` in https://github.com/zotero/zotero
