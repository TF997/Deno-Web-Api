import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v2.2/mod.ts";


const key = `RipHK2RXTU1UbEhhS0s3SWJ9RnhJNWFqZVZxITJjSVdhVWRJQVVVREYqUm1rVmxaSzJXSGRFMEdjWWhUSVdsNW5JWDU8OFZxIyVvV25eSkNJYzh4dElBJnVySTU5WGpWPjJAYFZtVWM1SWImbUdXbnA3dkZnUCRXV01WVGpIZStRckk1am1nRj05N21IRG9rb0lidCs4SWJ2aXVXaShgRUghd0xlR2h7SmtHJXtmXlZtVzFGV0BLZUtHRztPfEhhMjg4Rjx+PD9XTXBNQkgpZGZwSGVfUWxGbEErOUdHI0RpR2RWWG5JQSR8c0ZsSiNuR2k1ZTNWYEVgNVdIZE5wSTVJZGZXbj94cEYqWjEyV0hkNTNJYnRfNUctUEVxRyZERmtWPkR3bldNbnJySERmdHBIOChJaElXO3ZpR0JSV35GPUk5e1dqMTNwSWJ9STlHR2FKb0doc00xSCNjUUJIYUI0flY+ViRsRj05M35XSDIpfElBVVVCR2gjUDNJYnx8QUhEcUlBSDhFeW9HJTthZ0clLTEwSGUpJEJJYzgtdldAMGpCRmxJTW5IIzBGZVZfez1CSCE/Q1lWS095MVZMNC1FRy01R2dHaHx+aVc7dFh3R0JqZ2hGbDkwe0djYDNaVj5CQF9IKUF0NUlBUygyRyZwOHRWPV4+aEcmNSF+R2k2fmdXbihmcUhaKjJwSGYzZEVWPlYlQkdje3ltVmBnR0VHLWhUdkghQF5wSFp4PjFXSDJ4PkhmQ2FFVmxyZkFGZmxZe1dIPlE1SDhFc2lIRHhxcEghPzZ7SCEoM1dIKVVqRldIbitxRmdhcG9IWnczfkZnUC0wSClKK0JXajFESg==`


export async function createToken(username, password, role){
    console.log(`User Role: ${role}`)
    const payload = {
        user: username,
        role: role,
        exp: getNumericDate(60*60)
    }
    console.log(key)
    const jwt = await create({ alg: "HS512", typ: "JWT" }, payload, key);
    console.log(`Verify ${await verifyToken(jwt).role}`)
    return jwt
}

export async function verifyToken(jwt){
    console.log('Verify Token')
    console.log(jwt)
    console.log(key)
    const valid = await verify(jwt, key, 'HS512');
    console.log(valid)
    return valid
}