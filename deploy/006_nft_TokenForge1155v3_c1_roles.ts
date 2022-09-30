import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts} = hre;
    const {read, execute, log} = deployments;

    const {deployer} = await getNamedAccounts();
    console.log("Deployer", deployer)

    const token = await deployments.get('TokenForge1155v3_C1');
    console.log('TokenForge1155v3_C1-Address:', token.address)

    const minterRole = await read('TokenForge1155v3_C1', 'MINTER_ROLE');
    console.log('Minter-Role: ' + minterRole);
    const hasRole = await read('TokenForge1155v3_C1', 'hasRole', minterRole, '0xEb11E18EbeF238Fb254E2837a69a6ec2a3CF5e68');
    if(hasRole) {
        console.log("Minter-Role already exists");
    } else {
        await execute('TokenForge1155v3_C1', {
            from: deployer,
            log: true
        }, 'grantRole', minterRole, '0xEb11E18EbeF238Fb254E2837a69a6ec2a3CF5e68');

        log("- Transaction: " + token.transactionHash);
    }

    log("Ready.");

};
export default func;
func.dependencies = ['TokenForge1155v3_C1'];
func.tags = ['TokenForge1155v3_C1_roles'];

