
/* routes.js */

import { Router, etag } from 'https://deno.land/x/oak/mod.ts'
import { extractCredentials, saveFile, generateBody, addJobLinks, addApplianceLinks, getUniversalParams} from './modules/util.js'
import { login, register, getAccount, createAccount } from './modules/accounts.js'
import { addJob, setJobStatus, addJobDeclined } from './modules/jobs.js'
import { addAppliance } from './modules/appliances.js'
import { selectAllAppliances, selectApplianceById, selectAllJobs, selectJobById, selectAllJobsWithAppliances} from './modules/portal.js'


const router = new Router()

// the routes defined here
router.get('/', async context => {
	const data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

router.get('/api/v1/accounts', async context => {
	await getAccount(context);
})

router.post('/api/v1/accounts', async context => {
	await createAccount(context);
})

router.post('/api/v1/jobs', async context => {
	context.response.status = 400
	try {
		const declinedParam = context.request.url.searchParams.get('decline')
		const declined = declinedParam == "true" || declinedParam == "True" ? true : false;
		console.log(declined)
		if(!declined){
			const id = await addJob(context)
		}else{
			const id = await addJobDeclined(context)
			context.response.status = 201
			context.response.body = JSON.stringify(
				{
					data: {
						type:'job',
						id: id,
						links:{
							"self" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/jobs/${id}` },
							"job" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/jobs/${id}` }
						}
					}
				}
			)	
		}
	} catch(err) {
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'An error occurred',
						detail: err.message
					}
				]
			}
		)
	}
})


router.get('/api/v1/jobs', async context => {
	context.response.status = 400
	try{
		const params = await getUniversalParams(context.request.url.searchParams)
		let items;
		console.log(params.withAppliances)
		if(params.withAppliances && params.technicianId){
			items = await selectAllJobsWithAppliances(params)
		}else{
			items = await selectAllJobs(params)
		}
		addJobLinks(items)
		await generateBody(context, 'jobs', items)
	} catch(err) {
		console.log(err)
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'An error occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.get('/api/v1/jobs/:id', async context => {
	context.response.status = 400
	try{
		const params = await getUniversalParams(context.request.url.searchParams)
		const items =  await selectJobById(context.params.id, params.filter)
		console.log(items)
		addJobLinks(items)
		await generateBody(context, 'job', items)
	} catch(err) {
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'An error occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.post('/api/v1/appliances', async context => {
	context.response.status = 400
	try{
		const appliance = await context.request.body().value
		const id = await addAppliance(context, appliance)
		context.response.status = 201
		context.response.body = JSON.stringify(
			{
				data: {
					type: "appliance",
					id: id,
					attributes:{
						appliance: appliance.appliance, 
						age: appliance.age,
						manufacturer: appliance.manufacturer
					},
					links:{
						"self" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/appliances/${id}` },
						"job" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/appliances/${id}` }
					}
				}
			}
		)
	} catch(err) {
		console.log(err)
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'An error occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.get('/api/v1/appliances', async context => {
	context.response.status = 400
	try{
		const params = await getUniversalParams(context.request.url.searchParams)
		const items = await selectAllAppliances(params)
		addApplianceLinks(items)
		await generateBody(context, 'appliances', items)
	} catch(err) {
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'An error occurred',
						detail: err.message
					}
				]
			}
		)
	}
    
})

router.get('/api/v1/appliances/:id', async context => {
	context.response.status = 400
	try{
		const params = await getUniversalParams(context.request.url.searchParams)
		console.log(params)
		const items = await selectApplianceById(context.params.id, params.filter)
		addApplianceLinks(items)
		await generateBody(context, 'appliance', items)
	} catch(err) {
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'An error occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.put('/api/v1/jobs/:id', async context => {
	context.response.status = 400
	try{
		await setJobStatus(context)
		context.response.status = 200
		context.response.body = JSON.stringify(
			{
				data: {
					type: "job",
					id: context.params.id,
					links:{
						"self" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/appliances/${context.params.id}` },
						"job" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/appliances/${context.params.id}` }
					}
				}
			}
		)
	}
	catch(err){
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'An error occurred',
						detail: err.message
					}
				]
			}
		)
	}
})


router.get("/(.*)", async context => {      
// 	const data = await Deno.readTextFile('static/404.html')
// 	context.response.body = data
	const data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

export default router

