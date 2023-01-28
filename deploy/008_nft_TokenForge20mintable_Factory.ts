import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {getChainId, deployments, getNamedAccounts} = hre;
    const {deploy, execute, log, read} = deployments;
    const chainId = await getChainId()

    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)
    console.log("Chain-ID", chainId);

    const instance = await deploy('TokenForge20MintableFactory', {
        from: deployer,
        args: [],
        log: true,
        autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    });

    log("Contract: " + instance.address);
    log("- Transaction: " + instance.transactionHash);

//    await saveContractAddressAndWait(`contracts://factories/${chainId}/TokenForge/TokenForge20MintableFactory`, instance.address);
};

export default func;
func.dependencies = [];
func.tags = ['TokenForge20MintableFactory'];
