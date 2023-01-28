import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log} = deployments;
    
    const {deployer, signer} = await getNamedAccounts();
    console.log("Deployer", deployer)
    console.log('Signer: ' + signer);
    
    if(!signer) {
        console.log("Signer address is missing");
        return;
    }

    const instance = await deploy('TokenForge721', {
        from: deployer,
        args: ['TokenForge721', 'TF721', signer, 'ipfs://'],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    log("Factory: " + instance.address);

    // The transaction that was sent to the network to deploy the Contract
    log("- Transaction: " + instance.transactionHash);
};

export default func;
func.tags = ['TokenForge721'];
