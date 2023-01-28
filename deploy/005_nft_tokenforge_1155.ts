import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log} = deployments;
    return

    const {deployer, signer} = await getNamedAccounts();
    console.log("Deployer", deployer)
    console.log('Signer: ' + signer);

    if(!signer) {
        console.log("Signer address is missing");
        return;
    }
    
    const instance = await deploy('TokenForge1155', {
        from: deployer,
        args: [signer, 'ipfs://'],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    log("Factory: " + instance.address);

    // The transaction that was sent to the network to deploy the Contract
    log("- Transaction: " + instance.transactionHash);

    log("Ready.");

};
export default func;
func.dependencies = [''];
