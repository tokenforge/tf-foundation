const {ethers} = require("ethers");
const {DefenderRelaySigner, DefenderRelayProvider} = require('defender-relay-client/lib/ethers');

require('dotenv').config();

const {AutotaskClient} = require('defender-autotask-client');
const client = new AutotaskClient({apiKey: process.env.DEFENDER_API_KEY, apiSecret: process.env.DEFENDER_API_SECRET});


var ABI = [];

// Entrypoint for the Autotask
exports.handler = async function (event) {
    console.log(event);
    // Load value provided in the webhook payload (not available in schedule or sentinel invocations)
    const {value} = event.request.body;


    // Compare it with a local secret
    if (value !== event.secrets.expectedValue) return;

    // Initialize defender relayer provider and signer
    const provider = new DefenderRelayProvider(event);
    const signer = new DefenderRelaySigner(event, provider, {speed: 'fast'});

    // Create contract instance from the signer and use it to send a tx
    const contract = new ethers.Contract(0xE6b4cfEa0cDaA586902Ffd9DDd538Dc7E1EB74Fa, ABI, signer);
    if (await contract.canExecute()) {
        const tx = await contract.execute();
        console.log(`Called execute in ${tx.hash}`);
        return {tx: tx.hash};
    }
}


// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {

    (async () => {
        try {
            const items = await client.list();
            console.log(items);

            const data = {
                'key': "KEY1",
                'value': "MY VALUE 5",
            }
            const autoTask = await client.runAutotask("b8cc0def-57b7-4a12-964e-e3a29989d3e2", data);
            console.log(autoTask);

            let res;
            do {
                res = await client.getAutotaskRun(autoTask.autotaskRunId);
                console.log(res);
            } while (res.status === 'pending');

        } catch (e) {
            // Deal with the fact the chain failed
            console.log(e);
        }
    })();
    return

    console.log(process.env)
    console.log(process.env.DEFENDER_API_KEY)
    const {DEFENDER_API_KEY: apiKey, DEFENDER_API_SECRET: apiSecret} = process.env;
    exports.handler({apiKey, apiSecret})
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
