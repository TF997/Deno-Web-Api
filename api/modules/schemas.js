import Ajv from 'https://esm.sh/ajv'

export async function validateJob(data) {
  const ajv = new Ajv({allErrors: true});

  const jobSchema = {
    "properties": {
      "applianceid": { "type": "integer" },
      "description": { "type": "string" },
      "shortDescription": { "type": "string" },
      "payment": { "type": "integer" },
      "location": { "type": "string" },
      "username": { "type": "string" },
      "status": {enum:['Unassigned', 'Assigned'] },
      "technician": { "type": "integer" }
    },
    "required": ["applianceid","description","shortDescription","payment","location","username"]
  };
  const job = ajv.compile(jobSchema);
  const valid = job(data);
  if (valid) console.log('Valid!');
  else throw new Error('Invalid: ' + ajv.errorsText(job.errors));
}

export async function validateAppliance(data) {
  const ajv = new Ajv({allErrors: true});

  const applianceSchema = {
    "properties": {
      "appliance": { "type": "string" },
      "age": { "type": "integer" },
      "manufacturer": { "type": "string" },
    },
    "required":["appliance","age","manufacturer"]
  };

  const appliance = ajv.compile(applianceSchema);
  const valid = appliance(data);
  if (valid) console.log('Valid!');
  else throw new Error('Invalid: ' + ajv.errorsText(appliance.errors));
}