import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {read, execute, log} = deployments;

    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)

    const token = await deployments.get('TokenForge1155v3_Demo');
    console.log('TokenForge1155v3_Demo-Address:', token.address)

    const minterRole = await read('TokenForge1155v3_Demo', 'MINTER_ROLE');
    console.log('Minter-Role: ' + minterRole);
    
    // IF RInkeby
    const hasRole = await read('TokenForge1155v3_Demo', 'hasRole', minterRole, '0x21c51eE4dA90E6165C00FAf0b60cE4a8854AF4C3');
    if(hasRole) {
        console.log("Minter-Role already exists");
    } else {
        await execute('TokenForge1155v3_Demo', {
            from: deployer,
            log: true
        }, 'grantRole', minterRole, '0x21c51eE4dA90E6165C00FAf0b60cE4a8854AF4C3');

        log("- Transaction: " + token.transactionHash);
    }

    log("Ready.");

};
export default func;
func.dependencies = ['TokenForge1155v3_Demo'];
func.tags = ['TokenForge1155v3_Demo_roles'];

