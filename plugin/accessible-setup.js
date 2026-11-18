AccessibleSetup = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,
	addedElementIDs: [],

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},

	log(msg) {
		Zotero.debug("AccessibleSetup: " + msg);
	},

	/**
	 * Runs once. Everything here is guarded by the accessiblesetup.done pref,
	 * so later changes the user makes in Settings are not overwritten.
	 */
	async applySetup() {
		try {
			if (Zotero.Prefs.get('accessiblesetup.done')) {
				this.log("Setup already applied; skipping");
				return;
			}
			this.applyPrefs();
			await this.applyLibrary();
			Zotero.Prefs.set('accessiblesetup.done', true);
			this.log("Setup applied");
		}
		catch (e) {
			Zotero.logError(e);
		}
	},

	applyPrefs() {
		// View > Font Size, two steps up from the default (1.00)
		Zotero.Prefs.set('fontSize', '1.35');
		// Settings > General > "Automatically tag items with keywords and subject headings"
		Zotero.Prefs.set('automaticTags', false);
	},

	async applyLibrary() {
		let libraryID = Zotero.Libraries.userLibraryID;

		let wanted = ['00 Inbox', '01 Method', '02 Topic X', '03 Topic Y'];
		let existing = Zotero.Collections.getByLibrary(libraryID).map(c => c.name);
		for (let name of wanted) {
			if (existing.includes(name)) continue;
			let c = new Zotero.Collection();
			c.libraryID = libraryID;
			c.name = name;
			await c.saveTx();
			this.log("Created collection: " + name);
		}

		await Zotero.Tags.setColor(libraryID, 'To read', '#ff6666', 1);
		await Zotero.Tags.setColor(libraryID, 'Reading', '#ffbf40', 2);
		await Zotero.Tags.setColor(libraryID, 'Read', '#66cc66', 3);

		if (!Zotero.Searches.getByLibrary(libraryID).some(s => s.name == 'To read')) {
			let s = new Zotero.Search();
			s.libraryID = libraryID;
			s.name = 'To read';
			s.addCondition('tag', 'is', 'To read');
			await s.saveTx();
			this.log("Created saved search: To read");
		}
	},

	addToWindow(window) {
		let doc = window.document;
		let link = doc.createElement('link');
		link.id = 'accessible-setup-stylesheet';
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = this.rootURI + 'style.css';
		doc.documentElement.appendChild(link);
		this.storeAddedElement(link);
	},

	addToAllWindows() {
		for (let win of Zotero.getMainWindows()) {
			if (!win.ZoteroPane) continue;
			this.addToWindow(win);
		}
	},

	storeAddedElement(elem) {
		if (!elem.id) {
			throw new Error("Element must have an id");
		}
		this.addedElementIDs.push(elem.id);
	},

	removeFromWindow(window) {
		let doc = window.document;
		for (let id of this.addedElementIDs) {
			doc.getElementById(id)?.remove();
		}
		this.addedElementIDs = [];
	},

	removeFromAllWindows() {
		for (let win of Zotero.getMainWindows()) {
			if (!win.ZoteroPane) continue;
			this.removeFromWindow(win);
		}
	}
};
