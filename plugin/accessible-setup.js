AccessibleSetup = {
	// Bump when adding setup steps; installs below this level run the missing steps once.
	SETUP_LEVEL: 2,
	INBOX: '00 Inbox',
	COLUMNS: ['title', 'firstCreator', 'year'],
	TAGS: [['To read', '#ff6666'], ['Reading', '#ff8c19'], ['Read', '#5fb236']],

	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	notifierID: null,
	originalGetSaveTarget: null,

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
		this.patchConnectorTarget();
		this.notifierID = Zotero.Notifier.registerObserver({
			notify: (event, type, ids) => {
				if (ids.some(id => String(id).endsWith('/tagColors'))) this.updateTagTintAllWindows();
			}
		}, ['setting'], 'accessibleSetup');
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
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = this.rootURI + 'style.css';
		doc.documentElement.appendChild(link);

		let style = doc.createElement('style');
		style.id = 'accessible-setup-tag-tint';
		doc.documentElement.appendChild(style);
		this.updateTagTint(window);

		// Zotero 10 has a toolbar button for Reading Mode but no shortcut.
		// Cmd/Ctrl+Shift+M toggles it in the active PDF tab. (Cmd+Shift+R and
		// Cmd+Shift+L are taken by Read Aloud.)
		let handler = (event) => {
			if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) return;
			if (event.key.toLowerCase() !== 'm') return;
			let reader = window.Zotero_Tabs && Zotero.Reader.getByTabID(window.Zotero_Tabs.selectedID);
			let internal = reader?._type == 'pdf' && reader._internalReader;
			if (!internal) return;
			event.preventDefault();
			event.stopPropagation();
			// Same view choice as Zotero's own toggle: the split last interacted with
			let primary = internal._lastViewPrimary || !internal._secondaryView;
			let enabled = internal._state[primary ? 'primaryReadingModeEnabled' : 'secondaryReadingModeEnabled'];
			internal._handleReadingModeEnabledChange(!enabled);
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
		doc.getElementById('accessible-setup-stylesheet')?.remove();
		doc.getElementById('accessible-setup-tag-tint')?.remove();
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
		if (this.notifierID) Zotero.Notifier.unregisterObserver(this.notifierID);
	}
};
