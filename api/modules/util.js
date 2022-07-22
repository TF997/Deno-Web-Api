
/* util.js */

import { Status,  etag } from 'https://deno.land/x/oak/mod.ts'
import { Base64 } from 'https://deno.land/x/bb64/mod.ts'
import { Md5 } from 'https://deno.land/std/hash/md5.ts'
import { selectAllAppliances, selectApplianceById, selectAllJobs, selectJobById, insertSecurityLog} from './portal.js'
import { getUserRole } from './accounts.js'
import { verifyToken } from './encryption.js'


const baseurl = `https://venus-quality-8080.codio-box.uk/api/v1`
const originUrl = `http://venus-quality-8090.codio-box.uk`

export function setHeaders(context) {
	console.log('HEADER SHERE setHeaders')
	context.response.headers.set('Content-Type', 'application/vnd.api+json')
	context.response.headers.set('charset', 'utf-8')
	context.response.headers.set('Access-Control-Allow-Origin', `${originUrl}`)
	context.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT')
	context.response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, content-type')
	context.response.headers.set('Access-Control-Allow-Credentials', true)
}

export async function logAPICall(request){
	try{
		const method = request.method
		const path = request.url.href
		const ip = request.ip

		let requestBody
		let username = 'None'
		let userRole = 'None'
		let login = false
		let authType = 'JWT'
		try{
			requestBody = JSON.stringify(await request.body({type: 'json'}).value)
		}
		catch{
			requestBody = null
		}

		const token = request.headers.get('Authorization')
		const [type, hash] = token.split(' ')
		if(type == 'Basic'){
			authType = 'Basic'
			let user = extractCredentials(token)
			username = user.user
			login = true
		}else if(type == 'Bearer'){
			let user = await verifyToken(hash)
			username = user.user
			userRole = user.role
		}

		console.log(`LOGGING: ${method}, ${path}, ${ip}, ${requestBody}, ${username}, ${userRole}, ${login}`)
		const log = {
			method: method,
			requestPath: path,
			ip: ip,
			requestBody: requestBody,
			username: username,
			userRole: userRole,
			loginAttempt: login ? 1 : 0
		}
		await insertSecurityLog(log)
	}
	catch(err){
		console.log(err)
	}

}

export function extractCredentials(token) {
	console.log('extractCredentials')
	if(token === undefined) throw new Error('no auth header')
	const [type, hash] = token.split(' ')
	console.log(`${type} : ${hash}`)
	if(type !== 'Basic') throw new Error('wrong auth type')
	const str = atob(hash)
	console.log(str)
	if(str.indexOf(':') === -1) throw new Error('invalid auth format')
	const [user, pass] = str.split(':')
	console.log(user)
	console.log(pass)
	return { user, pass }
}

export function extractToken(token){
	console.log('ExtractToken')
	if(token === undefined) throw new Error('no auth header')
	const [type, jwt] = token.split(' ')
	console.log(`Type: ${type}`)	
	console.log(`Token: ${jwt}`)
	if(type !== 'Bearer') throw new Error('wrong auth type')
	return jwt
}

// https://github.com/thecodeholic/deno-serve-static-files/blob/final-version/oak/staticFileMiddleware.ts
export async function staticFiles(context, next) {
	const path = `${Deno.cwd()}/static${context.request.url.pathname}`
  const isFile = await fileExists(path)
  if (isFile) {
		// file exists therefore we can serve it
    await context.send(context, context.request.url.pathname, {
      root: `${Deno.cwd()}/static`
    })
  } else {
    await next()
  }
}

export async function errorHandler(context, next) {
	try {
		const method = context.request.method
		const path = context.request.url.pathname
		console.log(`${method} ${path}`)
    await next()
  } catch (err) {
		console.log(err)
		context.response.status = Status.InternalServerError
		const msg = { err: err.message }
		context.response.body = JSON.stringify(msg, null, 2)
  }
}

// checks if file exists
async function fileExists(path) {
  try {
    const stats = await Deno.lstat(path)
    return stats && stats.isFile
  } catch(e) {
    if (e && e instanceof Deno.errors.NotFound) {
      return false
    } else {
      throw e
    }
  }
}

export function saveFile(base64String, username) {
	console.log('save file')
	const [ metadata, base64Image ] = base64String.split(';base64,')
	console.log(metadata)
	const extension = metadata.split('/').pop()
	console.log(extension)
	const filename = `${username}-${Date.now()}.${extension}`
	console.log(filename)
	Base64.fromBase64String(base64Image).toFile(`./spa/uploads/${filename}`)
	console.log('file saved')
	return filename
}

export async function getEtag(path) {
	const stat = await Deno.stat(path)
	const mtime = stat.mtime
	const timestamp = Date.parse(mtime)
	const size = stat.size
	const uid = (`${path}:${timestamp}:${size}`)
	const md5 = new Md5()
	const etag = md5.update(uid).toString()
	return etag
}

export async function getAndCheckEtag(context, body) {
	const value = await etag.calculate(body);
	context.response.headers.set("ETag", value);
	console.log("Etag = ", value)
	const ifNoneMatchHeader = context.request.headers.get("If-None-Match")
	if(ifNoneMatchHeader){
		if(value == ifNoneMatchHeader){
			context.response.status = 304
		}
		else{
			context.response.status = 200
			context.response.body = body
		}
	}
	else{
		context.response.status = 200
		context.response.body = body
	}
}

export async function getUniversalParams(params){
	const filter = params.get('filter') ? params.get('filter') : '*';
	const limit = params.get('limit') ? params.get('limit') : 20;
	const offset = params.get('offset') ? params.get('offset') : 0;
	const username = params.get('username') ? params.get('username') : '%';
	const status = params.get('status') ? params.get('status') : '%';
	const technicianId = params.get('technicianId') ? params.get('technicianId') : '%';
	const withAppliances = params.get('withAppliances') == "true" || params.get('withAppliances') == "True" ? true : false;
	const dateOnly = params.get('dateOnly') == "true" || params.get('dateOnly') == "True" ? true : false;
	const longitude = params.get('userLong') ? params.get('userLong') : false;
	const latitude = params.get('userLat') ? params.get('userLat') : false;
	const distance = params.get('distance') == "true" || params.get('distance') == "True" ? true : false;

	params ={
		filter: filter,
		limit: limit,
		offset: offset,
		username: username,
		status: status,
		technicianId:technicianId,
		withAppliances: withAppliances,
		dateOnly: dateOnly,
		long: longitude,
		lat: latitude,
		distance: distance
	}
	return params
}

export async function addBehaviours(self){
    const links={
        "self" : { "href" : `${self}` },
		"jobs" : { "href" : `${baseurl}/jobs?{filter}&{username}&{status}&{technicianId}&{pageOffset}&{pageLimit}` },
        "appliances" : { "href" : `${baseurl}/appliances?{filter}&{pageOffset}&{pageLimit}` },
        "jobs" : { "href" : `${baseurl}/jobs/{jobId}` },
        "appliances" : { "href" : `${baseurl}/appliances/{applianceId}` }
    }
    return links
}



export async function addPageData(items, params){
	const length = items[0].totalItems
	const totalPages = params.limit > length ? 1 : Math.ceil(length/params.limit)
	const pageNumber = (params.offset/params.limit) + 1
	const remaining = totalPages - pageNumber
    const page={
        "size" : params.limit,
        "totalElements" : length, 
        "totalPages" : totalPages, 
        "number" : pageNumber,
		"remaining" : remaining 
    }
	return page
}



 function calculateDistance(lat1, lat2, lon1, lon2) //calculate distance function from https://www.geeksforgeeks.org/program-distance-two-points-earth/
	{
		// The math module contains a function
		// named toRadians which converts from
		// degrees to radians.
		lon1 =  lon1 * Math.PI / 180;
		lon2 = lon2 * Math.PI / 180;
		lat1 = lat1 * Math.PI / 180;
		lat2 = lat2 * Math.PI / 180;

		// Haversine formula
		let dlon = lon2 - lon1;
		let dlat = lat2 - lat1;
		let a = Math.pow(Math.sin(dlat / 2), 2)
				+ Math.cos(lat1) * Math.cos(lat2)
				* Math.pow(Math.sin(dlon / 2),2);
			
		let c = 2 * Math.asin(Math.sqrt(a));

		// Radius of earth in kilometers. Use 3956
		// for miles
		let r = 6371;

		// calculate the result
		return(c * r);
	}


export async function generateBody(context, type, items){
	const token = context.request.headers.get('Authorization')
	console.log(`Header: ${token}`)
	const role = await getUserRole(token)
	const params = await getUniversalParams(context.request.url.searchParams)
	console.log(`Calc Dist = ${params.long && params.lat && params.distance}`)
	let body;
	let distance = false
	if (type == 'appliances' || type == 'jobs'){
		const links = await addBehaviours(context.request.url)
		const page = await addPageData(items, params)
        let formattedItems = [];
		for (const item of items){
			console.log(item)
			const id = item.id
			if(params.dateOnly) {
				item['loggedtime'] =  (`${new Date(item['loggedtime']).getUTCDay()}/${new Date(item['loggedtime']).getUTCMonth()}/${new Date(item['loggedtime']).getUTCFullYear()}`)}
			if(params.long && params.lat && params.distance){
				const [long, lat] = item['userlocation'].split(',')
				item['distance'] =  calculateDistance(params.long, long, params.lat, lat)
				distance = true
				delete item['userlocation']
			}
			delete item['id']
			delete item['totalItems']
			const itemLinks = item['links']
			delete item['links']
			const fitem = {
				type: type,
            	id: id,
				attributes: item,
				links: itemLinks
			}
			formattedItems.push(fitem)
		}
		if(distance){
			formattedItems.sort(function(a, b) {
				if(a.type != 'jobs') return -1
				if(b.type != 'jobs') return 1
				console.log(a)
				console.log(b)
				if (a.attributes.distance < b.attributes.distance) return -1;
				if (a.attributes.distance > b.attributes.distance) return 1;
				return 0;
			});
		}

		formattedItems.push(links)
		formattedItems.push(page)
		body = JSON.stringify({
			data:formattedItems})
	}else{
		const item = items[0]
		const id = item.id
		delete item['id']
		const fitem = {
			type: type,
			id: id,
			attributes: item
		}
		body = JSON.stringify({
				data:fitem
			})
	}

	await getAndCheckEtag(context, body)
}


export async function addApplianceLinks(appliances){
    appliances.forEach(appliance => appliance.links = {
        "self" : { "href" : `${baseurl}/appliances/${appliance.id}` },
		"appliances" : { "href" : `${baseurl}/appliances` }
    })
}

export async function addJobLinks(jobs){
	console.log(jobs[1])
    jobs.forEach(job => job.links = {
        "self" : { "href" : `${baseurl}/jobs/${job.id}` },
        "appliance" : { "href" : `${baseurl}/appliances/${job.applianceId}` },
		"Jobs" : { "href" : `${baseurl}/jobs` }
    })
}
