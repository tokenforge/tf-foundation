import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {DefenderRelayProvider, DefenderRelaySigner} from "defender-relay-client/lib/ethers";
import {CreateRelayerRequest, RelayClient, RelayerParams} from "defender-relay-client";
import {appendFileSync, writeFileSync} from "fs";
import {ethers} from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log, read} = deployments;

    return;
    
    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)
    

    const { DEFENDER_API_KEY: apiKey, DEFENDER_API_SECRET: apiSecret } = process.env;
    
    /*  Create Relayer and save API
    -Keys
    // @ts-ignore
    const relayClient = new RelayClient({ apiKey, apiSecret });

    // create relay using defender client
    const requestParams = {
        name: 'MyRelayer',
        network: 'goerli',
        minBalance: BigInt(1e17).toString(),
    };
    const relayer = await relayClient.create(<CreateRelayerRequest>requestParams);
    writeFileSync('relay.json', JSON.stringify({
        relayer
    }, null, 2));
    console.log('Relayer ID: ', relayer);

    // create and save the api key to .env - needed for sending tx
    const {apiKey: relayerKey, secretKey: relayerSecret} = await relayClient.createKey(relayer.relayerId);
    appendFileSync('.env', `\n_RELAYER_KEY=${relayerKey}\n_RELAYER_SECRET=${relayerSecret}`);
    */


    const credentials = {apiKey: process.env._RELAYER_KEY, apiSecret: process.env._RELAYER_SECRET};
    // @ts-ignore
    const provider = new DefenderRelayProvider(credentials);
    // @ts-ignore
    const relaySigner = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });

    const contractFactory = await ethers.getContractFactory('TokenForge1155v3_C2');
    const myContract = await contractFactory.connect(relaySigner).deploy('0xeebA72dcE016a06055dbD0318429053bEd738c7e', 'ipfs://').then(f => f.deployed());

    writeFileSync('deploy.json', JSON.stringify({
        MyContract: myContract.address,
    }, null, 2));

    console.log(`MyContract: ${myContract.address}\n`);
};


    /*
    const provider =new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
        speed: 'fast'
    });
    
    const contractFactory = await ethers.getContractFactory('TokenForge1155v3_C2');
    const relayer = await contractFactory.connect(signer).deploy();
    console.log(1, relayer);
    await relayer.deployed();
    console.log(2, 'deplyed: ' +  relayer.address);*/
    
    //return;

    /*const instance = await deploy('TokenForge1155v3_C2', {
        from: deployer,
        args: ['0xeebA72dcE016a06055dbD0318429053bEd738c7e', 'ipfs://'],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    log("Contract: " + instance.address);
    log("- Transaction: " + instance.transactionHash);*/

    //log("Ready.");


export default func;
func.dependencies = [];
func.tags = ['TokenForge1155v3_C1'];
