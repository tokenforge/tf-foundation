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


import {ContractReceipt, Event} from "ethers";
import {Result} from "@ethersproject/abi";

export function findEventArgsByNameFromReceipt(receipt: ContractReceipt, eventName: string, argName?: string): null|Result|Array<any>|any {
    const events: Event[] | undefined = receipt.events?.filter((x: Event) => {
        return x.event == eventName;
    });

    const args: Result | undefined | any[] = events ? events[0]?.args : [];

    if (args !== undefined) {
        return argName ? args[argName] : args;
    } else {
        return null;
    }
}
