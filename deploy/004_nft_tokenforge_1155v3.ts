import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log} = deployments;
    
    return
    
    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)

    const instance = await deploy('TokenForge1155v3', {
        from: deployer,
        args: ['0xeebA72dcE016a06055dbD0318429053bEd738c7e', 'ipfs://'],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    log("Factory: " + instance.address);

    // The transaction that was sent to the network to deploy the Contract
    log("- Transaction: " + instance.transactionHash);

    log("Ready.");

};
export default func;
func.dependencies = ['TokenForge721'];