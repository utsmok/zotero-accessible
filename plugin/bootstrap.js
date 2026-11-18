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
	await AccessibleSetup.applySetup();
}

function onMainWindowLoad({ window }) {
	AccessibleSetup.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	AccessibleSetup.removeFromWindow(window);
}

function shutdown() {
	if (AccessibleSetup) {
		AccessibleSetup.removeFromAllWindows();
	}
	AccessibleSetup = undefined;
}

function uninstall() {}
