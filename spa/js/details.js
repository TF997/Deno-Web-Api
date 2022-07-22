/* details.js */

import { customiseNavbar, loadPage, unauthorizedLogout} from '../util.js'

export async function setup(node) {
	console.log('details: setup')
	try {
		console.log(node)
		document.querySelector('header h2').innerText = 'Job Details'
		if(localStorage.getItem('role') == 'Technician'){
			customiseNavbar(['home', 'workAvailable', 'myJobs', 'logout'])
			document.querySelector('header p').innerHTML = `> Logged in as <b> ${localStorage.getItem('username')} </b>, with role <b> ${localStorage.getItem('role')} </b>`
		}else{
			loadPage('home')
		}		
		const token = localStorage.getItem('authorization')
		console.log(token)
		if(token === null) customiseNavbar(['home', 'register', 'login']) //navbar if logged out
		const params = new URLSearchParams(window.location.search)
		const id = params.get('id')
		const technicianId = localStorage.getItem('id')
		await addContent(node, id,technicianId)
		node.querySelector('button[name="accept"]').addEventListener("click", async function(){
			await acceptJob(id, technicianId)
		})
		node.querySelector('button[name="decline"]').addEventListener("click", async function(){
			await declineJob(id, technicianId)
		})
		node.querySelector('button[name="cancel"]').addEventListener("click", await cancelJob)


	} catch(err) {
		console.error(err)
	}
}

async function getDistanceToJob(customerLocation, technicianLocation){
	console.log(`CUSTOMER ${customerLocation}`)
	console.log(`TECH ${technicianLocation}`)
	let distMiles 
	try{
		const url = `https://eu1.locationiq.com/v1/directions/driving/${customerLocation};${technicianLocation}?key=pk.39af96b029a3bd3aef08afab9b4e54ff`
		const response = await fetch(url, {method: 'GET'})
		const json = await response.json()
		distMiles = json.routes[0].legs[0].distance*0.001
		console.log(json)
		console.log(`DISTANCE ${distMiles}`)
	}catch{
		distMiles = 'Unable to calculate distance'
	}

	return distMiles
}


function getTechLocation() {
    return new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
    );
}

async function addContent(node, id, technicianId) {
	var url = `/api/v1/jobs/${id}`
	const query = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		}
	}
	const position = await getTechLocation()	
	console.log(url)
	console.log(query)
	const response = await fetch(url, query)
	if(response.status  == '401'){
		unauthorizedLogout()
	}
	if(response.status == '403'){
		showMessage('Only Technicians Can See Job Details')
		loadPage('home')
	}
	console.log(response)
	var json = await response.json()
	console.table(json)
	const job = json.data
	console.table(job)
	const template = document.querySelector('template#job')
	const fragment = template.content.cloneNode(true)
	fragment.querySelector('p[name="id"]').innerText = `Job ID ${job.id}`
	fragment.querySelector('p[name="shortDescription"]').innerText = `Summary: ${job.attributes.shortDescription}`
	fragment.querySelector('p[name="longDescription"]').innerText = `Description: ${job.attributes.longDescription}`
	fragment.querySelector('p[name="payment"]').innerText = `Payment Amount: ${job.attributes.payment}`
	fragment.querySelector('p[name="userlocation"]').innerText = `Job Location ${job.attributes.userlocation}`
	fragment.querySelector('p[name="distance"]').innerText = `Distance From Job: ${await getDistanceToJob(job.attributes.userlocation, `${position.coords.longitude},${position.coords.latitude}`)} KM`
	fragment.querySelector('p[name="loggedtime"]').innerText = `Time Job Logged: ${job.attributes.loggedtime}`
	fragment.querySelector('p[name="username"]').innerText = `Created By User ${job.attributes.username}`
	fragment.querySelector('p[name="jobstatus"]').innerText = `Job Status: ${job.attributes.jobstatus}`
	fragment.querySelector('p[name="appliance"]').innerText = `Appliance Type: ${job.attributes.appliance}`
	fragment.querySelector('p[name="age"]').innerText = `Appliance Age: ${job.attributes.age}`
	fragment.querySelector('p[name="manufacturer"]').innerText = `Appliance Manufacturer ${job.attributes.manufacturer}`
	node.appendChild(fragment)
}

async function acceptJob(id, technicianId){
	var url = `/api/v1/jobs/${id}`
	const acceptBody = {
		status: 'Assigned',
		technicianId: technicianId
	}
	console.log(acceptBody)
	const accept = {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		},
		body: JSON.stringify(acceptBody)
	}
	console.log(accept)
	var response = await fetch(url, accept)
	if(response.status  == '401'){
		unauthorizedLogout()
	}
	var json = await response.json()
	console.log(json)	
	loadPage('workAvailable')
}

async function declineJob(id, technicianId){
	var url = '/api/v1/jobs?decline=true'
	const declineBody = {
		id: id,
		technicianId: technicianId
	}
	console.log(declineBody)
	const decline = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		},
		body: JSON.stringify(declineBody)
	}
	console.log(decline)
	var response = await fetch(url, decline)
	if(response.status  == '401'){
		loadPage('logout')
	}
	var json = await response.json()
	console.log(json)
	loadPage('workAvailable')
}

async function cancelJob(){
	loadPage('workAvailable')
}