
/* login.js */

import { createToken, customiseNavbar, secureGet, loadPage, showMessage } from '../util.js'

export async function setup(node) {
	try {
		console.log('LOGIN: setup')
		console.log(node)
		document.querySelector('header h2').innerText = 'Login Page'
		customiseNavbar(['home', 'register'])
		document.querySelector('header p').innerHTML = `> Logged in as <b> ${localStorage.getItem('username')} </b>, with role <b> ${localStorage.getItem('role')} </b>`
		node.querySelector('form').addEventListener('submit', await login)
	} catch(err) {
		console.error(err)
	}
}

async function login() {
	event.preventDefault()
	console.log('form submitted')
	const formData = new FormData(event.target)
	const data = Object.fromEntries(formData.entries())
	const token = 'Basic ' + btoa(`${data.user}:${data.pass}`)
	console.log('making call to secureGet')
	const response = await secureGet('/api/v1/accounts', token)
	console.log(`Response Auth ${response.json.data.attributes.token}`)
	if(response.status === 200) {
		localStorage.setItem('username', response.json.data.attributes.username)
		localStorage.setItem('role', response.json.data.attributes.role)
		localStorage.setItem('id', response.json.data.id)
		localStorage.setItem('authorization', `Bearer ${response.json.data.attributes.token}`)
		showMessage(`you are logged in as ${response.json.data.attributes.username}`)
		await loadPage('home')
	} else {
		document.querySelector('input[name="pass"]').value = ''
		showMessage(response.json.errors[0].detail)
		}
}
