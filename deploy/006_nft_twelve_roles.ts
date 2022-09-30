import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, execute, log} = deployments;
    
    return
    
    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)

    const token = await deployments.get('twlvxtwlv_v01');
    console.log('twlvxtwlv_v01-Address:', token.address)


    await execute('twlvxtwlv_v01', {from: deployer, log: true}, 'grantRole', '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6', '0x1fc63dfcf47a305ef812dd259e2a77cc117fcc75');


    // The transaction that was sent to the network to deploy the Contract

    log("Ready.");

};
export default func;
func.dependencies = ['twlvxtwlv_v01'];

