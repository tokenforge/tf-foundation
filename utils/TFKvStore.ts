import {AutotaskRunResponse} from "defender-autotask-client/lib/models/autotask-run.res";

const {ethers} = require("ethers");
const {DefenderRelaySigner, DefenderRelayProvider} = require('defender-relay-client/lib/ethers');

require('dotenv').config({ path: require('find-config')('.env') })

const {AutotaskClient} = require('defender-autotask-client');

const client = new AutotaskClient({apiKey: process.env.DEFENDER_API_KEY, apiSecret: process.env.DEFENDER_API_SECRET});

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export async function saveContractAddress(domain: string, address: string): Promise<AutotaskRunResponse|null> {
    const data = {
        'key': domain,
        'value': address,
    }
    
    console.log(`- Store ${address} for ${domain}`);
    
    try {
        return await client.runAutotask("b8cc0def-57b7-4a12-964e-e3a29989d3e2", data);
    }
    catch(e) {
        console.log(e);
        return null;
    }
}

export async function saveContractAddressAndWait(domain: string, address: string) {
    return
    
    let res = await saveContractAddress(domain, address);
    if(!res) {
        return;
    }
    
    const {autotaskRunId, status} = res;
    
    do {
        try {
            res = await client.getAutotaskRun(autotaskRunId);
        }
        catch(e) {
            console.log(e);
            await delay(5000);
        }
        process.stdout.write('.');
        await delay(1000);
    } while(res?.status === 'pending');
    if(res?.status !== 'success') {
        console.log(res);
    } else {
        const body = res.result;
        const {hash} = JSON.parse(body);
        console.log(' Done: ' + hash)
    }
}
