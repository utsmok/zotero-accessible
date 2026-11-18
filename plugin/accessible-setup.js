AccessibleSetup = {
	// Bump when adding setup steps; installs below this level run the missing steps once.
	SETUP_LEVEL: 3,
	INBOX: '00 Inbox',
	COLUMNS: ['title', 'firstCreator', 'year'],
	READING_MODE_TYPES: ['pdf', 'snapshot'],
	TAGS: [['To read', '#ff6666'], ['Reading', '#ff8c19'], ['Read', '#5fb236']],

	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	notifierID: null,
	prefObserverIDs: [],
	originalGetSaveTarget: null,
	originalToggleTags: null,
	toastTimer: null,
	readerTabsSeen: new Set(),

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
		this.patchConnectorTarget();
		this.patchTagToggle();
		this.notifierID = Zotero.Notifier.registerObserver({
			notify: (event, type, ids, extraData) => this.onNotify(event, type, ids, extraData)
		}, ['setting', 'collection-item', 'tab'], 'accessibleSetup');
		this.prefObserverIDs = [
			Zotero.Prefs.registerObserver('accessiblesetup.lowGlare', () => this.applyLowGlare()),
			Zotero.Prefs.registerObserver('accessiblesetup.showEmptyFields', () => this.applyRootAttributesAllWindows()),
		];
		this.toolbarHandler = event => this.renderReaderToolbar(event);
		Zotero.Reader.registerEventListener('renderToolbar', this.toolbarHandler, this.id);
	},

	pref(name, fallback) {
		let value = Zotero.Prefs.get('accessiblesetup.' + name);
		return value === undefined ? fallback : value;
	},

	onNotify(event, type, ids, extraData) {
		if (type == 'setting') {
			if (ids.some(id => String(id).endsWith('/tagColors'))) this.updateTagTintAllWindows();
		}
		else if (type == 'collection-item' && event == 'add') {
			// Skip items arriving by sync (iPad saves): only react to saves on this Mac
			let inbox = this.getInbox();
			if (!inbox || Zotero.Sync.Runner.syncInProgress) return;
			let items = ids.map(id => id.split('-'))
				.filter(([collectionID]) => collectionID == inbox.id)
				.map(([, itemID]) => Zotero.Items.get(parseInt(itemID)))
				.filter(item => item?.isRegularItem());
			if (items.length) this.onInboxAdd(items);
		}
		else if (type == 'tab' && (event == 'add' || event == 'load')) {
			// A tab can start as "reader-loading" and fire "load" once the reader exists
			for (let id of ids) {
				if (!extraData?.[id]?.type?.startsWith('reader') || this.readerTabsSeen.has(id)) continue;
				this.readerTabsSeen.add(id);
				this.onReaderTab(id);
			}
		}
	},

	// New Inbox items get "To read" (unless they already carry a status tag),
	// and a confirmation appears where she is looking.
	async onInboxAdd(items) {
		try {
			let statusTags = this.TAGS.map(([name]) => name);
			for (let item of items) {
				if (statusTags.some(name => item.hasTag(name))) continue;
				// Type 1 (automatic): the connector's save session rewrites manual tags but keeps automatic ones
				item.addTag(statusTags[0], 1);
				await item.saveTx();
			}
			this.showToast(items.length == 1
				? `Saved in ${this.INBOX}: ${items[0].getDisplayTitle() || 'new item'}`
				: `${items.length} items saved in ${this.INBOX}`, this.TAGS[0][1]);
		}
		catch (e) {
			Zotero.logError(e);
		}
	},

	// Status tag buttons for the selected items: one fixed trackpad target per
	// tag, same effect as the number keys.
	addTagButtons(window) {
		let doc = window.document;
		let anchor = doc.getElementById('accessible-setup-focus-button');
		if (!anchor) return;
		for (let [name, color] of this.TAGS.slice().reverse()) {
			let button = doc.createElementNS('http://www.w3.org/1999/xhtml', 'button');
			button.className = 'accessible-setup-added accessible-setup-tag-button';
			button.textContent = name;
			button.title = `Add or remove the tag "${name}" on the selected items`;
			button.style.borderInlineStartColor = color;
			button.addEventListener('click', async () => {
				let items = window.ZoteroPane.getSelectedItems().filter(item => item.isRegularItem());
				if (!items.length) {
					this.showToast('Select an item first');
					return;
				}
				await Zotero.Tags.toggleItemsListTags(items, name);
			});
			anchor.after(button);
		}
	},

	log(msg) {
		Zotero.debug("AccessibleSetup: " + msg);
	},

	/**
	 * Each level runs once, guarded by the accessiblesetup.level pref, so later
	 * changes the user makes in Settings are not overwritten.
	 */
	async applySetup() {
		try {
			// 1.0.x stored a boolean "done" for level 1
			let level = Zotero.Prefs.get('accessiblesetup.level')
				|| (Zotero.Prefs.get('accessiblesetup.done') ? 1 : 0);
			if (level >= this.SETUP_LEVEL) {
				this.log("Setup already applied; skipping");
				return;
			}
			if (level < 1) {
				// View > Font Size; past the 1.5 menu maximum, which Zotero accepts
				Zotero.Prefs.set('fontSize', '1.7');
				// Settings > General > "Automatically tag items with keywords and subject headings"
				Zotero.Prefs.set('automaticTags', false);
				await this.applyLibrary();
			}
			if (level < 2) {
				// View > Note Font Size; 24 is the menu entry closest to 14 × 1.7
				Zotero.Prefs.set('note.fontSize', '24');
				// 1.0.x used colors outside Zotero's palette, which the tag list shows as black dots
				let libraryID = Zotero.Libraries.userLibraryID;
				for (let [name, oldColor] of [['Reading', '#ffbf40'], ['Read', '#66cc66']]) {
					if (Zotero.Tags.getColor(libraryID, name)?.color?.toLowerCase() == oldColor) {
						await Zotero.Tags.setColor(libraryID, name, this.TAGS.find(t => t[0] == name)[1]);
					}
				}
				await this.applyColumns();
			}
			if (level < 3) {
				// 1.1.0 could leave the Year column as wide as the window
				if (level == 2) await this.applyColumns();
				// Item details: fold the rarely used Related section
				Zotero.Prefs.set('panes.related.open', false);
				// Reading Mode and EPUB text: a plain sans-serif font instead of Georgia
				Zotero.Prefs.set('reader.ebookFontFamily', 'Verdana, Helvetica, Arial, sans-serif');
			}
			Zotero.Prefs.set('accessiblesetup.level', this.SETUP_LEVEL);
			Zotero.Prefs.clear('accessiblesetup.done');
			this.log("Setup applied up to level " + this.SETUP_LEVEL);
		}
		catch (e) {
			Zotero.logError(e);
		}
	},

	async applyLibrary() {
		let libraryID = Zotero.Libraries.userLibraryID;

		let wanted = [this.INBOX, '01 Method', '02 Topic X', '03 Topic Y'];
		let existing = Zotero.Collections.getByLibrary(libraryID).map(c => c.name);
		for (let name of wanted) {
			if (existing.includes(name)) continue;
			let c = new Zotero.Collection();
			c.libraryID = libraryID;
			c.name = name;
			await c.saveTx();
			this.log("Created collection: " + name);
		}
		// Zotero palette colors; positions 0 to 2 map to number keys 1 to 3
		for (let [position, [name, color]] of this.TAGS.entries()) {
			await Zotero.Tags.setColor(libraryID, name, color, position);
		}

		if (!Zotero.Searches.getByLibrary(libraryID).some(s => s.name == 'To read')) {
			let s = new Zotero.Search();
			s.libraryID = libraryID;
			s.name = 'To read';
			s.addCondition('tag', 'is', 'To read');
			await s.saveTx();
			this.log("Created saved search: To read");
		}
	},

	// Same effect as unticking columns in the item list's header menu.
	async applyColumns() {
		await Zotero.uiReadyPromise;
		let tree = Zotero.getActiveZoteroPane()?.itemsView?.tree;
		if (!tree) throw new Error("Item list not available; columns not set");
		for (let column of tree._columns._columns.slice()) {
			let show = this.COLUMNS.includes(column.dataKey);
			if (column.hidden != show) continue;
			let index = tree._columns._columns.findIndex(c => c.dataKey == column.dataKey);
			tree._columns.toggleHidden(index);
		}
		// Unhiding columns before the list is laid out can leave Year as wide as
		// the window; give the three columns fixed shares instead
		let columns = tree._columns;
		let total = tree._containerWidth || tree._topDiv?.clientWidth || 1000;
		let prefs = columns._getPrefs();
		let widths = { title: total * 0.62, firstCreator: total * 0.25, year: 110 };
		for (let [dataKey, width] of Object.entries(widths)) {
			prefs[dataKey] = { ...prefs[dataKey], width };
		}
		columns._storePrefs(prefs);
		await Zotero.getActiveZoteroPane().itemsView._resetColumns();
		this.log("Columns set to " + this.COLUMNS.join(', '));
	},

	getInbox() {
		return Zotero.Collections.getByLibrary(Zotero.Libraries.userLibraryID)
			.find(c => c.name == this.INBOX && !c.deleted);
	},

	// The connector saves into whatever is selected in the Zotero window. Make
	// "00 Inbox" the default for My Library instead; choosing another folder in
	// the connector popup still works.
	patchConnectorTarget() {
		let connector = Zotero.Server.Connector;
		let original = this.originalGetSaveTarget = connector.getSaveTarget;
		connector.getSaveTarget = function (...args) {
			let target = original.apply(this, args);
			let inbox = AccessibleSetup.getInbox();
			if (inbox && target.library?.libraryID == inbox.libraryID) {
				return { library: target.library, collection: inbox, editable: true };
			}
			return target;
		};
	},

	unpatchConnectorTarget() {
		if (this.originalGetSaveTarget) {
			Zotero.Server.Connector.getSaveTarget = this.originalGetSaveTarget;
			this.originalGetSaveTarget = null;
		}
	},

	// Number keys 1 to 9 toggle colored tags without visible feedback in her
	// field of view; confirm each change in the center of the window.
	patchTagToggle() {
		let original = this.originalToggleTags = Zotero.Tags.toggleItemsListTags;
		Zotero.Tags.toggleItemsListTags = async function (items, tagName) {
			let result = await original.apply(this, arguments);
			if (items.length) {
				let added = items[0].hasTag(tagName);
				let count = items.length == 1 ? '' : ` (${items.length} items)`;
				let color = Zotero.Tags.getColor(items[0].libraryID, tagName)?.color;
				AccessibleSetup.showToast(`${added ? 'Tag added' : 'Tag removed'}: ${tagName}${count}`, added ? color : null);
			}
			return result;
		};
	},

	unpatchTagToggle() {
		if (this.originalToggleTags) {
			Zotero.Tags.toggleItemsListTags = this.originalToggleTags;
			this.originalToggleTags = null;
		}
	},

	// A large message over the middle of the item list (or the window, in a
	// PDF tab). Zotero's own notices sit in corners, outside a 4-degree field.
	showToast(text, color) {
		let window = Zotero.getMainWindow();
		let toast = window?.document.getElementById('accessible-setup-toast');
		if (!toast) return;
		let area = window.Zotero_Tabs?.selectedType == 'library'
			? window.document.getElementById('zotero-items-pane')?.getBoundingClientRect()
			: null;
		if (!area?.width) area = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
		toast.textContent = text;
		toast.style.borderColor = color || '#fff';
		toast.style.left = (area.left + area.width / 2) + 'px';
		toast.style.top = (area.top + area.height / 2) + 'px';
		toast.hidden = false;
		window.clearTimeout(this.toastTimer);
		this.toastTimer = window.setTimeout(() => toast.hidden = true, 2500);
	},

	// Hide or show the collections pane and the item pane together, so only
	// the item list is left. Same steps as View > Layout.
	toggleFocusView(window) {
		let doc = window.document;
		let collectionsPane = doc.getElementById('zotero-collections-pane');
		let itemPane = doc.getElementById('zotero-item-pane');
		let hide = collectionsPane.getAttribute('collapsed') != 'true' || itemPane.getAttribute('collapsed') != 'true';
		doc.getElementById('zotero-collections-splitter').setAttribute('state', hide ? 'collapsed' : 'open');
		collectionsPane.setAttribute('collapsed', hide);
		doc.getElementById('zotero-items-splitter').setAttribute('state', hide ? 'collapsed' : 'open');
		itemPane.setAttribute('collapsed', hide);
		window.ZoteroPane.updateLayoutConstraints();
		this.updateFocusButton(window);
		this.showToast(hide ? 'Focus view: only the item list' : 'All panes shown');
	},

	isFocusView(window) {
		let doc = window.document;
		return doc.getElementById('zotero-collections-pane')?.getAttribute('collapsed') == 'true'
			&& doc.getElementById('zotero-item-pane')?.getAttribute('collapsed') == 'true';
	},

	updateFocusButton(window) {
		let button = window.document.getElementById('accessible-setup-focus-button');
		if (button) button.textContent = this.isFocusView(window) ? 'Show all panes' : 'Focus view';
	},

	activeReader(window) {
		let reader = window.Zotero_Tabs && Zotero.Reader.getByTabID(window.Zotero_Tabs.selectedID);
		return this.READING_MODE_TYPES.includes(reader?._type) && reader._internalReader ? reader : null;
	},

	async toggleReadingMode(reader) {
		let internal = reader._internalReader;
		// Same view choice as Zotero's own toggle: the split last interacted with
		let primary = internal._lastViewPrimary || !internal._secondaryView;
		let enabled = internal._state[primary ? 'primaryReadingModeEnabled' : 'secondaryReadingModeEnabled'];
		await internal._handleReadingModeEnabledChange(!enabled);
		if (!enabled) await this.styleReadingMode(reader, primary);
	},

	// Zotero's Reading Mode ignores the reader font setting and uses Georgia;
	// apply it, plus wider line spacing and a narrower column unless she
	// already changed those (Aa button) for this document.
	async styleReadingMode(reader, primary = true) {
		let internal = reader._internalReader;
		let view = primary ? internal._primarySDTView : internal._secondarySDTView;
		if (!view) return;
		await view.initializedPromise;
		view.setFontFamily?.(Zotero.Prefs.get('reader.ebookFontFamily'));
		let appearance = view.appearance;
		if (appearance?.lineHeight == 1.2 && appearance.pageWidth == 0) {
			// The reader runs in its own compartment and can't read plain objects from here
			internal._handleAppearanceChange(Cu.cloneInto({ ...appearance, lineHeight: 1.6, pageWidth: -1 }, reader._iframeWindow));
		}
	},

	// Opening a document moves its item from "To read" to "Reading", and PDFs
	// and saved web pages open in Reading Mode unless that is off in the View menu.
	async onReaderTab(tabID) {
		try {
			// The tab is registered before its reader exists
			let reader;
			for (let i = 0; i < 50 && !reader; i++) {
				reader = Zotero.Reader.getByTabID(tabID);
				if (!reader) await Zotero.Promise.delay(100);
			}
			if (!reader) return;
			await this.markReading(Zotero.Items.get(reader.itemID)?.parentItem);
			if (!this.pref('autoReadingMode', true)) return;
			await reader._initPromise;
			let internal = reader._internalReader;
			if (!this.READING_MODE_TYPES.includes(reader._type) || !internal) return;
			await internal._primaryView?.initializedPromise;
			if (internal._state.primaryReadingModeEnabled) return;
			// Pages Zotero can't reflow would show an error banner; leave them as they are
			let pack = await Zotero.SDT?.getPack(reader.itemID, {});
			if (pack && !pack.ok) return;
			await internal._handleReadingModeEnabledChange(true);
			await this.styleReadingMode(reader);
		}
		catch (e) {
			Zotero.logError(e);
		}
	},

	// A "Mark as Read" button in the PDF toolbar, so finishing a paper needs
	// no trip back to the library.
	renderReaderToolbar({ reader, doc, append }) {
		let button = doc.createElement('button');
		button.textContent = 'Mark as Read';
		button.title = 'Tag this item "Read"';
		button.style.cssText = 'font: inherit; font-size: 1.1em; font-weight: bold; color: #000; background: #fff;'
			+ 'border: 2px solid #000; border-inline-start: 10px solid ' + this.TAGS[2][1] + '; border-radius: 6px;'
			+ 'padding: 1px 10px; margin-inline: 6px; cursor: pointer;';
		button.addEventListener('click', () => this.markRead(Zotero.Items.get(reader.itemID)?.parentItem));
		append(button);
	},

	async markRead(item) {
		if (!item) return;
		let [toRead, reading, read] = this.TAGS.map(([name]) => name);
		item.removeTag(toRead);
		item.removeTag(reading);
		item.addTag(read);
		await item.saveTx();
		this.showToast(`Status: ${read}`, this.TAGS[2][1]);
	},

	async markReading(item) {
		let [toRead, reading] = this.TAGS.map(([name]) => name);
		if (!item?.hasTag(toRead) || item.hasTag(reading)) return;
		item.removeTag(toRead);
		item.addTag(reading);
		await item.saveTx();
		this.showToast(`Status: ${reading}`, this.TAGS[1][1]);
	},

	// Root attributes that switch optional rules in style.css
	applyRootAttributes(window) {
		let root = window.document.documentElement;
		root.toggleAttribute('accessible-low-glare', this.pref('lowGlare', false));
		root.toggleAttribute('accessible-show-empty-fields', this.pref('showEmptyFields', false));
	},

	applyRootAttributesAllWindows() {
		for (let win of Zotero.getMainWindows()) this.applyRootAttributes(win);
	},

	// Optional cream backgrounds instead of white, for glare. Off by default:
	// white with black text gives the highest contrast.
	async applyLowGlare() {
		let on = this.pref('lowGlare', false);
		this.applyRootAttributesAllWindows();
		let libraryID = Zotero.Libraries.userLibraryID;
		let themes = Zotero.SyncedSettings.get(libraryID, 'readerCustomThemes');
		themes = Array.isArray(themes) ? themes : [];
		let theme = themes.find(t => t.label == 'Low glare');
		if (on) {
			if (!theme) {
				let n = 1;
				while (themes.some(t => t.id == 'custom' + n)) n++;
				theme = { id: 'custom' + n, label: 'Low glare', background: '#f5efe0', foreground: '#000000' };
				await Zotero.SyncedSettings.set(libraryID, 'readerCustomThemes', [...themes, theme]);
			}
			Zotero.Prefs.set('reader.lightTheme', theme.id);
		}
		else if (theme && Zotero.Prefs.get('reader.lightTheme') == theme.id) {
			Zotero.Prefs.clear('reader.lightTheme');
		}
	},

	addViewMenuItems(window) {
		let doc = window.document;
		let popup = doc.getElementById('menu_viewPopup');
		if (!popup) return;
		let items = [
			['Focus View (Hide Side Panes)', () => this.isFocusView(window), () => this.toggleFocusView(window), 'Shift+H'],
			['Open PDFs in Reading Mode', () => this.pref('autoReadingMode', true), () => Zotero.Prefs.set('accessiblesetup.autoReadingMode', !this.pref('autoReadingMode', true))],
			['Low-Glare Colors (Cream Background)', () => this.pref('lowGlare', false), () => Zotero.Prefs.set('accessiblesetup.lowGlare', !this.pref('lowGlare', false))],
			['Show Empty Fields in Item Details', () => this.pref('showEmptyFields', false), () => Zotero.Prefs.set('accessiblesetup.showEmptyFields', !this.pref('showEmptyFields', false))],
		];
		let separator = doc.createXULElement('menuseparator');
		separator.classList.add('accessible-setup-added');
		popup.append(separator);
		let menuitems = items.map(([label, isChecked, command, key]) => {
			let menuitem = doc.createXULElement('menuitem');
			menuitem.classList.add('accessible-setup-added');
			menuitem.setAttribute('type', 'checkbox');
			menuitem.setAttribute('label', label);
			if (key) menuitem.setAttribute('acceltext', (Zotero.isMac ? '⇧⌘' : 'Ctrl+') + key.replace('Shift+', Zotero.isMac ? '' : 'Shift+'));
			menuitem.addEventListener('command', command);
			popup.append(menuitem);
			return [menuitem, isChecked];
		});
		let onShowing = () => {
			for (let [menuitem, isChecked] of menuitems) menuitem.setAttribute('checked', !!isChecked());
		};
		popup.addEventListener('popupshowing', onShowing);
		window.__accessibleSetupMenuHandler = onShowing;
	},

	addFocusButton(window) {
		let doc = window.document;
		let anchor = doc.getElementById('zotero-tb-note-add');
		if (!anchor) return;
		let button = doc.createElementNS('http://www.w3.org/1999/xhtml', 'button');
		button.id = 'accessible-setup-focus-button';
		button.className = 'accessible-setup-added';
		button.addEventListener('click', () => this.toggleFocusView(window));
		anchor.after(button);
		this.updateFocusButton(window);
	},

	// Tint the whole item row with its colored tag, for whatever colors are
	// assigned. Selected rows keep Zotero's own highlight and text color.
	tagTintCSS() {
		let colors = [];
		for (let library of Zotero.Libraries.getAll()) {
			for (let { color } of Zotero.Tags.getColors(library.libraryID).values()) {
				color = color.toLowerCase();
				if (!colors.includes(color)) colors.push(color);
			}
		}
		// Later rules win, so the lowest tag position goes last. !important beats the odd-row stripe rule.
		return colors.reverse().map(c => `#zotero-items-tree .row:not(.selected):has(.tag-swatch[data-color="${c}"]) `
			+ `{ background-color: color-mix(in srgb, ${c} 30%, white) !important; color: #000 !important; }`).join('\n');
	},

	updateTagTint(window) {
		let style = window.document.getElementById('accessible-setup-tag-tint');
		if (style) style.textContent = this.tagTintCSS();
	},

	updateTagTintAllWindows() {
		for (let win of Zotero.getMainWindows()) this.updateTagTint(win);
	},

	addToWindow(window) {
		let doc = window.document;
		let link = doc.createElement('link');
		link.id = 'accessible-setup-stylesheet';
		link.className = 'accessible-setup-added';
		link.type = 'text/css';
		link.rel = 'stylesheet';
		// Version in the URL: Gecko caches stylesheets by URL across plugin updates
		link.href = this.rootURI + 'style.css?v=' + this.version;
		doc.documentElement.appendChild(link);

		let style = doc.createElement('style');
		style.id = 'accessible-setup-tag-tint';
		style.className = 'accessible-setup-added';
		doc.documentElement.appendChild(style);
		this.updateTagTint(window);

		let toast = doc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
		toast.id = 'accessible-setup-toast';
		toast.className = 'accessible-setup-added';
		toast.setAttribute('role', 'status');
		toast.setAttribute('aria-live', 'polite');
		toast.hidden = true;
		doc.documentElement.appendChild(toast);

		this.addFocusButton(window);
		this.addTagButtons(window);
		this.addViewMenuItems(window);
		this.applyRootAttributes(window);

		// Cmd/Ctrl+Shift+M: Reading Mode in the active PDF tab (Zotero 10 has a
		// toolbar button only; Cmd+Shift+R and Cmd+Shift+L start Read Aloud).
		// Cmd/Ctrl+Shift+H: Focus view (Shift+F opens advanced search) in the library tab.
		let handler = (event) => {
			if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) return;
			let key = event.key.toLowerCase();
			if (key == 'm') {
				let reader = this.activeReader(window);
				if (!reader) return;
				this.toggleReadingMode(reader).catch(e => Zotero.logError(e));
			}
			else if (key == 'h' && window.Zotero_Tabs?.selectedType == 'library') {
				this.toggleFocusView(window);
			}
			else {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
		};
		doc.addEventListener('keydown', handler, true);
		window.__accessibleSetupKeyHandler = handler;
	},

	addToAllWindows() {
		for (let win of Zotero.getMainWindows()) {
			if (!win.ZoteroPane) continue;
			this.addToWindow(win);
		}
	},

	removeFromWindow(window) {
		let doc = window.document;
		if (window.__accessibleSetupKeyHandler) {
			doc.removeEventListener('keydown', window.__accessibleSetupKeyHandler, true);
			delete window.__accessibleSetupKeyHandler;
		}
		if (window.__accessibleSetupMenuHandler) {
			doc.getElementById('menu_viewPopup')?.removeEventListener('popupshowing', window.__accessibleSetupMenuHandler);
			delete window.__accessibleSetupMenuHandler;
		}
		doc.documentElement.removeAttribute('accessible-low-glare');
		doc.documentElement.removeAttribute('accessible-show-empty-fields');
		for (let elem of doc.querySelectorAll('.accessible-setup-added')) elem.remove();
	},

	removeFromAllWindows() {
		for (let win of Zotero.getMainWindows()) {
			if (!win.ZoteroPane) continue;
			this.removeFromWindow(win);
		}
	},

	shutdown() {
		this.removeFromAllWindows();
		this.unpatchConnectorTarget();
		this.unpatchTagToggle();
		Zotero.Reader.unregisterEventListener('renderToolbar', this.toolbarHandler);
		if (this.notifierID) Zotero.Notifier.unregisterObserver(this.notifierID);
		for (let id of this.prefObserverIDs) Zotero.Prefs.unregisterObserver(id);
		this.prefObserverIDs = [];
	}
};
