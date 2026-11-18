var AccessibleSetup;

function log(msg) {
	Zotero.debug("AccessibleSetup: " + msg);
}

function install(data, reason) {}

async function startup({ id, version, rootURI }) {
	log("Starting " + version);
	await Zotero.initializationPromise;
	Services.scriptloader.loadSubScript(rootURI + 'accessible-setup.js');
	AccessibleSetup.init({ id, version, rootURI });
	AccessibleSetup.addToAllWindows();
	// Not awaited: the column step waits for the main window, which may open after startup
	AccessibleSetup.applySetup();
}

function onMainWindowLoad({ window }) {
	AccessibleSetup.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	AccessibleSetup.removeFromWindow(window);
}

function shutdown() {
	if (AccessibleSetup) {
		AccessibleSetup.shutdown();
	}
	AccessibleSetup = undefined;
}

function uninstall() {}
