
/* workAvailable.js */

import { customiseNavbar, loadPage, unauthorizedLogout } from '../util.js'

export async function setup(node, page, limit, offset) {
	console.log('workAvailable: setup')
	try {
		console.log(node)
		document.querySelector('header h2').innerText = 'Unassigned Jobs'
		if(localStorage.getItem('role') == 'Technician'){
			customiseNavbar(['home', 'workAvailable', 'myJobs', 'logout'])
			document.querySelector('header p').innerHTML = `> Logged in as <b> ${localStorage.getItem('username')} </b>, with role <b> ${localStorage.getItem('role')} </b>`
		}else{
			loadPage('home')
		}			
		const token = localStorage.getItem('authorization')
		console.log(token)
		if(token === null) customiseNavbar(['home', 'register', 'login']) //navbar if logged out
		await addContent(node, page, limit, offset)
	} catch(err) {
		console.error(err)
	}
}

// this example loads the data from a JSON file stored in the uploads directory
async function addContent(node, page, limit, offset) {
	console.log(`PAGE ${page} ${limit} ${offset	}`)
    const role = localStorage.getItem('role')
	await loadWorkAvailable(node, page, limit, offset)
}

async function loadWorkAvailableIfNew(node, page, limit, offset){
	const position = await getTechLocation()
	const id = localStorage.getItem('id')
	const etag = localStorage.getItem(`workAvailableEtag${page}`)
	var url = `/api/v1/jobs?status=unassigned&withAppliances=true&technicianId=${id}&limit=${limit}&offset=${offset}&userLong=${position.coords.longitude}&userLat=${position.coords.latitude}&distance=true&filter=jobs.id, appliances.appliance, shortDescription, payment&distance=true`
	const query = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization'),
			'If-None-Match': etag
		}
	}
	const response = await fetch(url, query)

	if(response.status  == '401'){
		await unauthorizedLogout()
	}
	if(response.status == '403'){
		showMessage('Only Technicians Can See Available Work')
		loadPage('home')
	}
	if(response.status == '200'){
		var json = await response.json()
		const responseEtag = response.headers.get('etag')
		console.log(responseEtag)
		localStorage.setItem(`workAvailableEtag${page}`, responseEtag)
		console.log(json.data)
		const data = json.data
		localStorage.setItem(`workAvailable${page}`, JSON.stringify(data))
		loadPage('workAvailable', page, limit, offset)
	}else if(response.status == '304'){
		return('304')
	}
	console.log(await response.json())
	return('404')
}

function getTechLocation() {
    return new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
    );
}


async function loadWorkAvailable(node, page, limit, offset){
	const jobs = JSON.parse(localStorage.getItem(`workAvailable${page}`))
	console.table(jobs)
	let fragment;
	console.log(jobs != null)
	const template = document.querySelector('template#jobsAvailable')
	if (jobs != null){
		for(const job of jobs){
			if(job.type == 'jobs'){
				if(job.attributes.Declined == 0){
					const fragment = template.content.cloneNode(true)
					fragment.querySelector('p[name="distance"]').innerText = `${job.attributes.distance} KM away`
					fragment.querySelector('p[name="applianceType"]').innerText = `Appliance Type: ${job.attributes.appliance}`
					fragment.querySelector('header[name="summary"]').innerText = job.attributes.shortDescription
					fragment.querySelector('p[name="payment"]').innerText = `Payment: £${job.attributes.payment}`
					console.log(job.id)
					fragment.querySelector('form').addEventListener("submit", async function(){
					event.preventDefault()
						loadPage(`details?id=${job.id}`)
					})
					node.appendChild(fragment)
				}
			}
			else{
				console.log("Job Declined")
			}
		}
	}
	console.log("LOAD COMPLETE")
	loadWorkAvailableIfNew(node, page, limit, offset)

	console.log(pages)
	const buttonTemp = document.querySelector('template#pagination')
	const buttonFragment = buttonTemp.content.cloneNode(true)
	if(pages.remaining == 0 ){
		console.log('Next')
		buttonFragment.querySelector('button[name="next"]').disabled = true;
	}else{
		buttonFragment.querySelector('button[name="next"]').addEventListener("click", async function() {
			loadPage('workAvailable', page+1, limit, offset+limit)
		});
	}
	if(pages.number < 2 ){
		console.log('Prev')
		buttonFragment.querySelector('button[name="prev"]').disabled = true;
	}else{
		buttonFragment.querySelector('button[name="prev"]').addEventListener("click", async function() {
			loadPage('workAvailable', page-1, limit, offset-limit)
		});
	}
	node.appendChild(buttonFragment)
}

