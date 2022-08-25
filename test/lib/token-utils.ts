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
