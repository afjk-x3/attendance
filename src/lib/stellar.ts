import {
  rpc,
  TransactionBuilder,
  Networks,
  Address,
  Contract,
  xdr,
  scValToNative,
  nativeToScVal,
  Account,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";
const IS_MAINNET = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "MAINNET";
const NETWORK_PASSPHRASE = IS_MAINNET ? Networks.PUBLIC : Networks.TESTNET;
const RPC_URL = IS_MAINNET ? "https://mainnet.sorobanrpc.com" : "https://soroban-testnet.stellar.org";

const server = new rpc.Server(RPC_URL);

// Helper to get a properly configured Contract instance
function getContract() {
  if (!CONTRACT_ID) {
    throw new Error("Stellar Contract ID is not configured in the application environment variables.");
  }
  try {
    return new Contract(CONTRACT_ID);
  } catch (e) {
    throw new Error(`Invalid Contract ID configured: ${CONTRACT_ID}. Please check your environment variables.`);
  }
}

async function getTxBuilder(pubKey: string) {
    const account = await server.getAccount(pubKey);
    return new TransactionBuilder(account, {
        fee: "1000",
        networkPassphrase: NETWORK_PASSPHRASE,
    });
}

export async function createEventTx(
  organizerPubKey: string,
  eventId: number,
  maxAttendees: number,
  endTimestamp: number
) {
  const contract = getContract();
  const txBuilder = await getTxBuilder(organizerPubKey);

  const tx = txBuilder
    .addOperation(
      contract.call("create_event",
        nativeToScVal(organizerPubKey, { type: "address" }),
        nativeToScVal(eventId, { type: "u64" }),
        nativeToScVal(maxAttendees, { type: "u32" }),
        nativeToScVal(endTimestamp, { type: "u64" })
      )
    )
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  return preparedTx;
}

export async function checkInTx(
  attendeePubKey: string,
  eventId: number
) {
  const contract = getContract();
  const txBuilder = await getTxBuilder(attendeePubKey);

  const tx = txBuilder
    .addOperation(
      contract.call("check_in",
        nativeToScVal(eventId, { type: "u64" }),
        nativeToScVal(attendeePubKey, { type: "address" })
      )
    )
    .setTimeout(30)
    .build();

  const preparedTx = await server.prepareTransaction(tx);
  return preparedTx;
}

export async function getAttendeeCount(eventId: number): Promise<number> {
  try {
    const contract = getContract();
    const txBuilder = await getTxBuilder("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF");
  
    const tx = txBuilder
      .addOperation(
        contract.call("get_attendee_count", nativeToScVal(eventId, { type: "u64" }))
      )
      .setTimeout(30)
      .build();
      
    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(simResult)) {
        if(simResult.result?.retval) {
            return scValToNative(simResult.result.retval) as number;
        }
    }
  } catch(e) {
      console.error(e);
  }
  return 0;
}
export async function getGlobalAttendees(eventId: number): Promise<string[]> {
  try {
    const contract = getContract();
    const txBuilder = await getTxBuilder("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF");
  
    const tx = txBuilder
      .addOperation(
        contract.call("get_attendees", nativeToScVal(eventId, { type: "u64" }))
      )
      .setTimeout(30)
      .build();
      
    const simResult = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(simResult)) {
        if(simResult.result?.retval) {
            const val = scValToNative(simResult.result.retval);
            // It returns an array of Addresses, which scValToNative parses as strings (public keys)
            return val as string[];
        }
    }
  } catch(e) {
      console.error(e);
  }
  return [];
}
export async function submitTx(preparedTx: any) {
    let response;
    try {
        response = await signTransaction(preparedTx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
    } catch (e: any) {
        throw new Error(`Wallet error: ${e.message || "Failed to connect to wallet"}`);
    }

    if (response.error || !response.signedTxXdr) {
        if (response.error && response.error.includes("User declined")) {
             throw new Error("Transaction was rejected in your wallet.");
        }
        throw new Error(response.error?.toString() || "Failed to sign transaction. Please try again.");
    }
    
    let txToSubmit;
    try {
        txToSubmit = TransactionBuilder.fromXDR(response.signedTxXdr, NETWORK_PASSPHRASE);
    } catch (e) {
        throw new Error("Failed to parse signed transaction. Please try again.");
    }

    let sendResponse;
    try {
        sendResponse = await server.sendTransaction(txToSubmit as any);
    } catch (e: any) {
        throw new Error(`Network error: Failed to broadcast transaction to Stellar. ${e.message || ""}`);
    }
    
    if (sendResponse.status === "PENDING") {
        let txResponse = await server.getTransaction(sendResponse.hash);
        let attempts = 0;
        while (txResponse.status === "NOT_FOUND" && attempts < 10) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            txResponse = await server.getTransaction(sendResponse.hash);
            attempts++;
        }
        if (txResponse.status === "SUCCESS") {
            return sendResponse.hash;
        }
        if (txResponse.status === "FAILED") {
            throw new Error(`Smart Contract Error: Transaction failed on-chain. This might mean the event is full or already ended.`);
        }
        throw new Error(`Transaction timed out or failed with status: ${txResponse.status}`);
    }
    
    throw new Error(`Failed to submit transaction: ${sendResponse.status}`);
}
