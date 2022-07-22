import { selectAllAppliances, selectApplianceById,insertAppliance } from './portal.js'
import { validateAppliance } from './schemas.js'
import { getUserRole } from './accounts.js'
import { extractCredentials} from './util.js'

export async function addAppliance(context, appliance){
    const token = context.request.headers.get('Authorization')
    console.log(`Header Token: ${token}`)
	const role = await getUserRole(token)
	console.log(role)
    if(role != 'Customer') {
        context.response.status = 403
        throw new Error ('Only Customers can add appliances')
    }
    await validateAppliance(appliance);
    return await insertAppliance(appliance);
}