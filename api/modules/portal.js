import { db } from './db.js'


export async function insertJob(job) {
	try{
		job.status = "Unassigned"
		job.time = new Date().toUTCString()
		job.technicianId = null;
		const sql = `
		INSERT INTO jobs(applianceId,longDescription,shortDescription,payment,userlocation,loggedtime,username,jobstatus)
		VALUES(
			"${job.applianceid}",
			"${job.description}",
			"${job.shortDescription}",
			"${job.payment}",
			"${job.location}",
			"${job.time}",
			"${job.username}",
			"${job.status}"
		)`
		console.log(sql)
		const response = await db.query(sql)
		console.log(response.lastInsertId)
		job.id = response.lastInsertId
		return job
	}catch(err){
		console.log(err)
	}
}

export async function insertSecurityLog(log){
	const sql = `
	INSERT INTO securityLogs(loggedtime,method,requestPath,ip,username,userRole,loginAttempt,requestBody)
	VALUES(
		"${new Date().toUTCString()}",
		"${log.method}",
		"${log.requestPath}",
		"${log.ip}",
		"${log.username}",
		"${log.userRole}",
		"${log.loginAttempt}",
		?
	)`
	console.log(sql)
	await db.query(sql, [log.requestBody])
}

export async function insertAppliance(appliance) {
	const sql = `
	INSERT INTO appliances(appliance, age, manufacturer) 
	VALUES(
		"${appliance.appliance}",
		"${appliance.age}",
		"${appliance.manufacturer}"
		)`
	console.log(sql)
	const response = await db.query(sql)
	console.log(response.lastInsertId)
	return response.lastInsertId
}

export async function insertDeclinedJob(job){
	const sql = `
	INSERT INTO declined(jobId, technicianId) 
	VALUES(
		"${job.id}",
		"${job.technicianId}"
		)`
	console.log(sql)
	const response = await db.query(sql)
	console.log(response.lastInsertId)
	return response.lastInsertId
}

export async function selectAllAppliances(params) {
	const sql = `SELECT	${params.filter}, (select COUNT(*) from jobs) as totalItems
	 FROM appliances 
	 LIMIT ${params.offset}, ${params.limit}`
	console.log(sql)
	const appliances = await db.query(sql)
	return appliances
}

export async function selectApplianceById(id, filter) {
	const sql = `SELECT	${filter} 
	FROM appliances 
	WHERE id = ${id}`
	console.log(sql)
	const appliances = await db.query(sql)
	return appliances
}

export async function selectAllJobs(params) {
	const username = '%'
	const sql = `SELECT	${params.filter}, (select COUNT(*) from jobs) as totalItems
	FROM jobs
	WHERE
	('${params.username}' = '%' or username = '${params.username}') AND
	('${params.technicianId}' = '%' or technicianId = '${params.technicianId}') AND
	('${params.status}' = '%' or jobstatus = '${params.status}')
	LIMIT ${params.offset}, ${params.limit}`
	console.log(sql)
	const jobs = await db.query(sql)
	return jobs
}

export async function selectAllJobsWithAppliances(params) {
	let sql;
	let jobs
	if(params.filter == '*') params.filter = 'jobs.*, appliances.appliance, appliances.age, appliances.manufacturer'
	if(params.technicianId != "%" && (params.status == 'Unassigned' || params.status == 'unassigned')){
		if(params.distance) params.filter = `${params.filter}, userlocation`
		console.log(params.distance)
		jobs = await db.transaction(async (conn) => {
			await conn.execute(`DROP TEMPORARY TABLE IF EXISTS temp_tech;`);
			await conn.execute(`DROP TEMPORARY TABLE IF EXISTS temp_tech_count;`);
			await conn.execute(`
			CREATE TEMPORARY TABLE temp_tech AS 
				SELECT
				${params.filter}, 
				(CASE WHEN EXISTS (SELECT * FROM declined WHERE declined.jobId = jobs.id AND declined.technicianId = ${params.technicianId}) THEN 1 ELSE 0 END) AS Declined
				FROM jobs
				INNER JOIN appliances ON jobs.applianceId = appliances.id
				WHERE
				('${params.username}' = '%' or username = '${params.username}') AND
				('${params.status}' = '%' or jobstatus = '${params.status}');`
				);

			await conn.execute(`
			CREATE TEMPORARY TABLE temp_tech_count AS 
				SELECT
				jobs.*, appliances.appliance, appliances.age, appliances.manufacturer, 
				(CASE WHEN EXISTS (SELECT * FROM declined WHERE declined.jobId = jobs.id AND declined.technicianId = ${params.technicianId}) THEN 1 ELSE 0 END) AS Declined
				FROM jobs
				INNER JOIN appliances ON jobs.applianceId = appliances.id
				WHERE
				('${params.username}' = '%' or username = '${params.username}') AND
				('${params.status}' = '%' or jobstatus = '${params.status}');`
				);
			return await conn.query(`select temp_tech.*, (select COUNT(*) from temp_tech_count) as totalItems from temp_tech where Declined = 0 LIMIT ${params.offset}, ${params.limit};`);
	});
	} else{
		sql = `SELECT
		${params.filter}, (select COUNT(*) from jobs) as totalItems
		FROM jobs
		INNER JOIN appliances ON jobs.applianceId = appliances.id
		WHERE
		('${params.username}' = '%' or username = '${params.username}') AND
		('${params.technicianId}' = '%' or technicianId = '${params.technicianId}') AND
		('${params.status}' = '%' or jobstatus = '${params.status}')
		LIMIT ${params.offset}, ${params.limit}`
		console.log(sql)
		jobs = await db.query(sql)
	}
	return jobs
}

export async function selectJobById(id, filter) {
	const sql = `SELECT	jobs.*, appliances.appliance, appliances.age, appliances.manufacturer
	FROM jobs 
	INNER JOIN appliances ON jobs.applianceId = appliances.id
	WHERE jobs.id = ${id}`
	console.log(sql)
	const job = await db.query(sql)
	return job
}

export async function updateJobById(id, status, technicianId){
	let sql;
	if(technicianId){
		sql = `
		UPDATE jobs
		SET jobstatus = "${status}",
		technicianId = ${technicianId}
		WHERE id = ${id}
		`
	} else{
		sql = `
		UPDATE jobs
		SET jobstatus = "${status}",
		WHERE id = ${id}
		`
	}

	console.log(sql)
	const response = await db.query(sql)
	console.log(response)
	return response.lastInsertId
}