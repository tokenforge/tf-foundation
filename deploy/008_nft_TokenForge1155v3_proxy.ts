import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log, read} = deployments;

    const {deployer, signer} = await getNamedAccounts();
    console.log("Deployer", deployer)
    console.log('Signer: ' + signer);

    if(!signer) {
        console.log("Signer address is missing");
        return;
    }
    
    return;

    const instance = await deploy('TokenForge1155v3Upgradeable', {
        from: deployer,
        log: true,
        proxy: {
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                methodName: "initialize",
                args: [signer, 'ipfs://'],
            }
        },
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    log("Contract: " + instance.address);
    log("- Transaction: " + instance.transactionHash);

    log("Ready.");
};
export default func;
func.dependencies = [];
func.tags = ['TokenForge1155v3Upgradeable'];
