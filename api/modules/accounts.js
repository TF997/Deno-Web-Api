
/* accounts.js */

import { compare, genSalt, hash } from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'
import { extractCredentials, extractToken} from './util.js'
import { create } from 'https://deno.land/x/djwt@v2.4/mod.ts'
import { db } from './db.js'
import { createToken, verifyToken } from './encryption.js'

const saltRounds = 10
const salt = await genSalt(saltRounds)

export async function login(credentials) {
	const { user, pass } = credentials
	let sql = `SELECT count(id) AS count FROM accounts WHERE user="${user}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`username "${user}" not found`)
	sql = `SELECT * FROM accounts WHERE user = "${user}";`
	records = await db.query(sql)
	const userRecord = records[0]
	const valid = await compare(pass, userRecord.pass)
	if(valid === false) throw new Error(`invalid password for account "${user}"`)
	console.log(userRecord)
	userRecord.token = await createToken(userRecord.user, userRecord.pass, userRecord.roles)
	return userRecord
}

export async function getUserRole(credentials){
	console.log(`Get User Role`)
	const token = await extractToken(credentials)
	const user = await verifyToken(token)
	console.log(user)
	return user.role
}

export async function getUsername(credentials){
	console.log(`Get User name`)
	const token = await extractToken(credentials)
	const user = await verifyToken(token)
	console.log(user)
	return user.user
}

export async function register(credentials) {
	console.log('REGISTER')
	credentials.pass = await hash(credentials.pass, salt)
	const sql = `INSERT INTO accounts(user, pass, roles) VALUES("${credentials.name}", "${credentials.pass}", "${credentials.role}")`
	console.log(sql)
	await db.query(sql)
	return true
}


export async function getAccount(context){
	console.log('GET /api/accounts')
	const token = context.request.headers.get('Authorization')
	console.log(`auth: ${token}`)
	try {
		const credentials = extractCredentials(token)
		console.log(credentials)
		const records = await login(credentials)
		console.log(records)
		console.log(`username: ${records.user}`)
		context.response.body = JSON.stringify(
			{
				data: { 
					type: 'account',
					id: records.id,
					attributes: {
						username: records.user,
						role: records.roles,
						token: records.token
						},
					links: {
						self:{
							href:context.request.url.href
							}
						}
					}
			}, null, 2)
	} catch(err) {
		console.log(err)
		context.response.status = 401
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '401 Unauthorized.',
						detail: err.message
					}
				]
			}
		, null, 2)
	}
}

export async function createAccount(context){
	console.log('Post /api/account/create')
	const body  = await context.request.body()
	const data = await body.value
	console.log(data)
	await register(data)
	context.response.status = 201
	context.response.body = JSON.stringify({ 
		status: 'success', 
		msg: 'account created' 
		})
}