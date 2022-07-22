
/* home.js */

import { customiseNavbar, loadPage, unauthorizedLogout, showMessage } from '../util.js'

export async function setup(node, page, limit, offset) {
	console.log('HOME: setup')
	try {
		console.log(node)
		document.querySelector('header h2').innerText = 'Home'
		console.log(localStorage.getItem('role'))
		if(localStorage.getItem('role') == 'Technician'){
			customiseNavbar(['home', 'workAvailable', 'myJobs', 'logout'])
			document.querySelector('header p').innerHTML = `> Logged in as <b> ${localStorage.getItem('username')} </b>, with role <b> ${localStorage.getItem('role')} </b>`
		}else{
			customiseNavbar(['home', 'newJob',  'logout'])
			document.querySelector('header p').innerHTML = `> Logged in as <b> ${localStorage.getItem('username')} </b>, with role <b> ${localStorage.getItem('role')} </b>`
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
    const role = localStorage.getItem('role')
	console.log(localStorage)
	if(role == "Technician"){
		loadCustomerData(node, page, limit, offset)
	}
}


function loadCustomerData(node, page, limit, offset){
	const jobs = JSON.parse(localStorage.getItem(`techHomeJobs${page}`))
	let fragment;
	console.log(jobs != null)
	const template = document.querySelector('template#jobs')
	if(jobs != null){
		jobs.forEach(job =>{
			if(job.type == 'jobs'){
				console.log(job)
				fragment = template.content.cloneNode(true)
				fragment.querySelector('p[name="applianceType"]').innerText = job.attributes.appliance 
				fragment.querySelector('header[name="summary"]').innerText = job.attributes.shortDescription
				fragment.querySelector('p[name="date"]').innerText = (`${new Date(job.attributes.loggedtime).getUTCDay()}/${new Date(job.attributes.loggedtime).getUTCMonth()}/${new Date(job.attributes.loggedtime).getUTCFullYear()}`) 
				fragment.querySelector('p[name="status"]').innerText = job.attributes.jobstatus 
				node.appendChild(fragment)
			}
		})
	}
	console.log("LOAD COMPLETE")
	loadCustomerDataIfNew(node, page, limit, offset)

	const pages = jobs.at(-1)
	console.log(pages)
	const buttonTemp = document.querySelector('template#pagination')
	const buttonFragment = buttonTemp.content.cloneNode(true)
	if(pages.remaining == 0 ){
		console.log('Next')
		buttonFragment.querySelector('button[name="next"]').disabled = true;
	}else{
		buttonFragment.querySelector('button[name="next"]').addEventListener("click", async function() {
			loadPage('myJobs', page+1, limit, offset+limit)
		});
	}
	if(pages.number < 2 ){
		console.log('Prev')
		buttonFragment.querySelector('button[name="prev"]').disabled = true;
	}else{
		buttonFragment.querySelector('button[name="prev"]').addEventListener("click", async function() {
			loadPage('myJobs', page-1, limit, offset-limit)
		});
	}
	node.appendChild(buttonFragment)
}

async function loadCustomerDataIfNew(node, page, limit, offset){
	const etag = localStorage.getItem(`techHomeEtag${page}`)
	let fragment;
	const jobs = await getUserJobs(etag, page, limit, offset)
	console.log(jobs)
	const template = document.querySelector('template#jobs')
	if(jobs != '304' && jobs != '404'){
		console.log('200')
		loadPage('myJobs', page, limit, offset)
	}
}


async function getUserJobs(etag, page, limit, offset){
	console.log("GetJobs")
	const username = localStorage.getItem('id')
	var url = `/api/v1/jobs?technicianId=${username}&withAppliances=true&limit=${limit}&offset=${offset}`
	console.log(`Auth: ${localStorage.getItem('authorization')}`)
	const query = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization'),
			'If-None-Match': etag
		}
	}
	console.log(url)
	console.log(query)
	const response = await fetch(url, query)
	console.log(response)
	if(response.status  == '401'){
		await unauthorizedLogout()
	}
	if(response.status == '200'){
		var json = await response.json()
		const responseEtag = response.headers.get('etag')
		console.log(responseEtag)
		localStorage.setItem(`techHomeEtag${page}`, responseEtag)
		console.log(json.data)
		const data = json.data
		localStorage.setItem(`techHomeJobs${page}`, JSON.stringify(data))
		return('200')
	}else if(response.status == '304'){
		return('304')
	}
	console.log(await response.json())
	return('404')
}
