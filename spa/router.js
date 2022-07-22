
/* router.js */

import { triggerPageChange } from './util.js'

document.addEventListener('popstate', triggerPageChange)

document.querySelectorAll('nav a').forEach(element => element.addEventListener('click', router))

router()

async function router(event) {
	if(event) { // has this been triggered by the click event?
		event.preventDefault()
		console.log(event.target.href)
		history.pushState(null, null, event.target.href)
	}
	try {
		await triggerPageChange()
	} catch(err) {
		console.log(err)
	}
}
