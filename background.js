const state = {
	preset: ['mail.google.com'],
	blacklist: undefined,
}

async function toggleSite() {
	// get host, toggle, save
	let [tab] = await browser.tabs.query({active: true, currentWindow: true})
	let h = new URL(tab.url).host
	if (state.blacklist.has(h)) {
		state.blacklist.delete(h)
	} else {
		state.blacklist.add(h)
	}

	await saveBlacklist()
	await browser.tabs.sendMessage(tab.id, {enabled: !state.blacklist.has(h)})
}

function handleMessage(req, sender, sendResponse) {
	switch (req.op) {
	case "closeTab":
		browser.tabs.remove(sender.tab.id)
		break
	case "enabled":
		sendResponse({enabled: !state.blacklist.has(req.arg)})
		break
	}
}

async function loadBlacklist() {
	let saved = await browser.storage.local.get(['blacklist'])
	if (!saved.blacklist) {
		saved.blacklist = state.preset
	}
	state.blacklist = new Set(saved.blacklist)
}

async function saveBlacklist() {
	let ar = Array.from(state.blacklist)
	await browser.storage.local.set({'blacklist': ar})
}

async function init() {
	await loadBlacklist()

	browser.runtime.onMessage.addListener(handleMessage)
	browser.browserAction.onClicked.addListener(toggleSite)
}

init()
