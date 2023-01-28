import {config as dotEnvConfig} from 'dotenv';
import 'hardhat-deploy';
import 'hardhat-deploy-tenderly';

dotEnvConfig();

import {HardhatUserConfig} from 'hardhat/types';

import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';

import 'solidity-coverage';
import 'hardhat-gas-reporter';

import {task} from 'hardhat/config';

import {node_url, accounts, addForkConfiguration} from './utils/network';

// TODO: reenable solidity-coverage when it works
// import "solidity-coverage";

const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

const PRIVATE_KEY_MAINNET = process.env.PRIVATE_KEY_MAINNET || '';

console.log("INFURA: ", INFURA_API_KEY)
console.log(node_url('rinkeby'));

const PRIVATE_KEY_RINKEBY =
    process.env.PRIVATE_KEY_RINKEBY! ||
    '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'; // well known private key

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    solidity: {
        compilers: [{
            version: '0.8.9', settings: {
                optimizer: {
                    enabled: true,
                    runs: 1000,
                },
            }
        }],
    },

    namedAccounts: {
        deployer: 0,
        admin: 0,
        backend: 1,
        signer: process.env['SIGNER_ADDRESS'] as string,
    },

    networks: addForkConfiguration({

        hardhat: {
            initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
        },
        localhost: {
            url: node_url('localhost'),
            accounts: accounts(),
        },
        mumbai: {
            url: node_url('polygon-mumbai'),
            accounts: accounts('mumbai'),
        },
        matic: {
            url: node_url('polygon-matic'),
            accounts: accounts('matic'),
        },
        goerli: {
            url: node_url('goerli'),
            accounts: accounts('goerli'),
            gas: 2100000,
            gasPrice: 8000000000
        },
        arbitrum_goerli: {
            url: node_url('ARBITRUM_GOERLI'),
            accounts: accounts('arbitrum_goerli'),
            gas: 2100000,
            gasPrice: 8000000000
        },
        optimism_goerli: {
            url: node_url('OPTIMISM_GOERLI'),
            accounts: accounts('optimism_goerli'),
            gas: 2100000,
            gasPrice: 8000000000
        },       
        fuji: {
            url: 'https://api.avax-test.network/ext/bc/C/rpc',
            gasPrice: 225000000000,
            chainId: 43113,
            accounts: accounts('fuji'),
        },
        avalanche: {
            url: 'https://api.avax.network/ext/bc/C/rpc',
            gasPrice: 225000000000,
            chainId: 43114,
            accounts: accounts('avax'),
        },
        // Moonbase Alpha network specification (MoonBeam)
        moonbaseAlpha: {
            url: 'https://rpc.api.moonbase.moonbeam.network',
            chainId: 1287, // 0x507 in hex,
            accounts: accounts('moonbeam')
        },
        evmOS: {
            url: 'https://eth.bd.evmos.org:8545',
            chainId: 9001,
            accounts: accounts('evmos')
        },
        tEvmOS: {
            url: 'https://eth.bd.evmos.dev:8545',
            chainId: 9000,
            accounts: accounts('tevmos')
        }

    }),
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: {
            mainnet: ETHERSCAN_API_KEY,
            goerli: ETHERSCAN_API_KEY,
            moonbaseAlpha: 'EER4PCJ3I7R9M6DKGI1JU2DFCABAKZ92WT',
            
        },
        
    },

    paths: {
        sources: "./contracts",
        artifacts: "./artifacts",
        cache: "./cache",
        deployments: '../deployments/tf-foundation',
    },

    /*gasReporter: {
        currency: 'EUR',
        gasPrice: 21,
        coinmarketcap: process.env.COINMARKETCAP_APIKEY,
    }*/

    typechain: {
        outDir: 'typechain',
        target: 'ethers-v5',
    },
    mocha: {
        timeout: 0,
    },
    external: process.env.HARDHAT_FORK
        ? {
            deployments: {
                // process.env.HARDHAT_FORK will specify the network that the fork is made from.
                // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
                hardhat: ['../deployments/tf-foundation/' + process.env.HARDHAT_FORK],
                localhost: ['../deployments/tf-foundation/' + process.env.HARDHAT_FORK],
            },
        }
        : undefined,

    tenderly: {
        project: 'template-ethereum-contracts',
        username: process.env.TENDERLY_USERNAME as string,
    },

};

export default config;
