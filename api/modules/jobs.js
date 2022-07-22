import { selectAllJobs, selectJobById,insertJob, updateJobById, insertDeclinedJob } from './portal.js'
import { validateJob } from './schemas.js'
import { getUserRole, getUsername } from './accounts.js'
import { extractCredentials} from './util.js'



export async function addJob(context){
    const token = context.request.headers.get('Authorization')
	const role = await getUserRole(token)
    const username = await getUsername(token)
	console.log(role)
    if(role != 'Customer'){
        context.response.status = 403
        throw new Error ('Only Customers can add a job')
    } 
    const job = await context.request.body().value
    job.username = username
    await validateJob(job);
    const newJob = await insertJob(job);  
    context.response.status = 201
    context.response.body = JSON.stringify(
        {
            data: {
                type: "job",
                id: newJob.id,
                attributes: {
                    applianceId: newJob.applianceid,
                    longDescription: newJob.description,
                    shortDescription: newJob.shortDescription,
                    payment: newJob.payment,
                    loggedtime: newJob.time,
                    username: newJob.username,
                    userlocation: newJob.location,
                    status: newJob.status,
                    technicianId: newJob.technicianId
                },
                links:{
                    "self" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/jobs/${newJob.id}` },
                    "job" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/jobs/${newJob.id}` },
                    "appliance" : { "href" : `https://venus-quality-8080.codio-box.uk/api/v1/appliances/${newJob.applianceid}` }
                }
            }
        }
    )  
}

export async function addJobDeclined(context){
    const token = context.request.headers.get('Authorization')
	const role = await getUserRole(token)
	console.log(role)
    if(role != 'Technician') {
        context.response.status = 403
        throw new Error ('Only Technicians can decline a job')
    }
    const job = await context.request.body().value
    return await insertDeclinedJob(job);    
}

export async function setJobStatus(context){
    const token = context.request.headers.get('Authorization')
	const role = await getUserRole(token)
	console.log(role)
    if(role != 'Technician') {
        context.response.status = 403 
        throw new Error ('Only Technicians can update a job status')
    }
    const job = await context.request.body().value
    const status = job.status
    const technicianId = job.technicianId
    await updateJobById(context.params.id, status, technicianId)
}



