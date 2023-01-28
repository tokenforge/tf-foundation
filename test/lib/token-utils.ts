// SPDX-License-Identifier: MIT
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io
/**
 * @dev Learn more about this on https://token-forge.io


 _______    _              ______
 |__   __|  | |            |  ____|
 | | ___ | | _____ _ __ | |__ ___  _ __ __ _  ___
 | |/ _ \| |/ / _ \ '_ \|  __/ _ \| '__/ _` |/ _ \
 | | (_) |   <  __/ | | | | | (_) | | | (_| |  __/
 |_|\___/|_|\_\___|_| |_|_|  \___/|_|  \__, |\___|
 __/ |
 |___/

 */


import {ContractReceipt, ContractTransaction, Event} from "@ethersproject/contracts";
import {Result} from "@ethersproject/abi";

export async function getTokenIdFromTransaction(transaction: Promise<ContractTransaction>): Promise<string> {
    const receipt: ContractReceipt = await (await transaction).wait();

    const tokenId = getTokenIdFromTransferEvent(receipt);
    if(tokenId) {
        return tokenId;
    }
    
    return getTokenIdFromIssuedEvent(receipt);
}

export function getTokenIdFromTransferEvent(receipt: ContractReceipt): string {
    const events: Event[] | undefined = receipt.events?.filter((x: Event) => {
        return x.event == 'Transfer';
    });
    const args: Result | undefined | any[] = events ? events[0]?.args : [];

    if (args !== undefined) {
        return args[2];
    } else {
        return "";
    }
}

export function getTokenIdFromIssuedEvent(receipt: ContractReceipt): string {
    const events: Event[] | undefined = receipt.events?.filter((x: Event) => {
        return x.event == 'Issued';
    });
    const args: Result | undefined | any[] = events ? events[0]?.args : [];

    if (args !== undefined) {
        return args[1];
    } else {
        return "";
    }
} 
