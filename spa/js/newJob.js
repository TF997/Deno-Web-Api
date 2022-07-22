/* newJob.js */

import { customiseNavbar, showMessage, loadPage, unauthorizedLogout } from '../util.js'

export async function setup(node) {
	console.log('HOME: setup')
	try {
		console.log(node)
		document.querySelector('header h2').innerText = 'Add A New Job'
		if(localStorage.getItem('role') == 'Customer'){
			customiseNavbar(['home', 'newJob',  'logout'])
			document.querySelector('header p').innerHTML = `> Logged in as <b> ${localStorage.getItem('username')} </b>, with role <b> ${localStorage.getItem('role')} </b>`
			const token = localStorage.getItem('authorization')
			console.log(token)
			if(token === null) customiseNavbar(['home', 'register', 'login']) //navbar if logged out
			await addContent(node)
			if (navigator.geolocation) {
				console.log('Geolocation API supported!')
				navigator.geolocation.getCurrentPosition(await onSuccess, await onError)
			}
			node.querySelector('form').addEventListener('submit', await addJob)
		}else{
			loadPage('home')
		}	
	} catch(err) {
		console.error(err)
	}
}

// this example loads the data from a JSON file stored in the uploads directory
async function addContent(node) {
    var response = await fetch('/uploads/appliances.json')
	const appliances = await response.json()
	response = await fetch('/uploads/manufacturers.json')
	const manufacturers = await response.json()
	const template = document.querySelector('template#addJob')
    const fragment = template.content.cloneNode(true)
	for(const appliance of appliances.data) {
        const newOption = document.createElement('option');
        const optionText = document.createTextNode(appliance);
        newOption.appendChild(optionText);
        newOption.setAttribute('value',appliance);
        fragment.querySelector('select[name="appliance"]').appendChild(newOption);
	}
	for(const manufacturer of manufacturers.data) {
        const newOption = document.createElement('option');
        const optionText = document.createTextNode(manufacturer);
        newOption.appendChild(optionText);
        newOption.setAttribute('value',manufacturer);
        fragment.querySelector('select[name="manufacturer"]').appendChild(newOption);
	}
    node.appendChild(fragment)
}

async function checkData(data){
	if(data.appliance == 'Select Appliance' || data.manufacturer == 'Select Manufacturer' || data.shortDesc.length < 1 || data.longDesc.length < 1){
		return false
	} else {
		return true
	}
}

async function addJob(){
	event.preventDefault()
	const formData = new FormData(event.target)
	const data = Object.fromEntries(formData.entries())
	const valid = await checkData(data)
	if(valid){
		data.user = localStorage.getItem('username')
		data.applianceid=await postAppliance(data)
		console.log(data)
		await postJob(data)
	}
	else{
		showMessage(`Please check you have filled out all the form data`)
	}
}

async function postJob(data){
	document.querySelector('button').disabled = true;
	const jobData = await getJob(data);
	console.log(jobData)
		const url = '/api/v1/jobs'
		const job = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/vnd.api+json',
				'Authorization': localStorage.getItem('authorization')
			},
			body: JSON.stringify(jobData)
		}
	const response = await fetch(url, job)
	if(response.status  == '401'){
		unauthorizedLogout()
	}
	if(response.status == '403'){
		showMessage('Only Customers Can Add A Job')
		loadPage('home')
	}
	const json = await response.json()
	console.log(json)
	loadPage('home')
	showMessage('Job Added')
}

async function postAppliance(data){
	const url = '/api/v1/appliances'
	const applianceData = await getAppliance(data)
	console.log(applianceData)
	const appliance = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		},
		body: JSON.stringify(applianceData)
	}
	console.log(appliance)
	const response = await fetch(url, appliance)
	if(response.status  == '401'){
		unauthorizedLogout()
	}
	if(response.status == '403'){
		showMessage('Only Customers Can Add A Job')
		loadPage('home')
	}
	const json = await response.json()
	console.log(json.data.id)
	return json.data.id;
}

async function onSuccess(position) {
	const loc = position.coords
	console.log(loc)
	document.querySelector('input[name="lat"]').value = loc.latitude
	document.querySelector('input[name="lon"]').value = loc.longitude
	document.querySelector('button').disabled = false;
	document.querySelector("button").className = "btn btn-primary";
	document.querySelector("button").innerText = "Add Job"
}


async function onError(error) {
	console.log(error.message)
}

async function getAppliance(data){
	const appliance = {
		age: parseInt(data.age),
		manufacturer: data.manufacturer,
		appliance: data.appliance
	}

	return appliance
}

async function getJob(data){
	const job = {
		applianceid: parseInt(data.applianceid),
		description: data.longDesc,
		shortDescription: data.shortDesc,
		payment: parseInt(data.pay),
		location: `${data.lon},${data.lat}`,
		username: data.user,
		status: 'Unassigned'
	}
	return job
}

