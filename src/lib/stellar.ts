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

const CONTRACT_ID = "CABY44BSU3JM6E3UENRWCDG5YHHLFP2IPIDH5BV3I436U773W5QOZQBI";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const RPC_URL = "https://soroban-testnet.stellar.org";

const server = new rpc.Server(RPC_URL);

export async function createEventTx(
  organizerPubKey: string,
  eventId: number,
  maxAttendees: number,
  endTimestamp: number
) {
  const account = await server.getAccount(organizerPubKey);
  const contract = new Contract(CONTRACT_ID);

  const txBuilder = new TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

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
  const account = await server.getAccount(attendeePubKey);
  const contract = new Contract(CONTRACT_ID);

  const txBuilder = new TransactionBuilder(account, {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

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
  const contract = new Contract(CONTRACT_ID);
  
  // We can simulate a transaction to read state without submitting
  const txBuilder = new TransactionBuilder(new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"), {
    fee: "1000",
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  
  const tx = txBuilder
    .addOperation(
      contract.call("get_attendee_count", nativeToScVal(eventId, { type: "u64" }))
    )
    .setTimeout(30)
    .build();
    
  try {
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

export async function submitTx(preparedTx: any) {
    const response = await signTransaction(preparedTx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
    if (response.error || !response.signedTxXdr) {
        throw new Error(response.error?.toString() || "Failed to sign transaction");
    }
    const txToSubmit = TransactionBuilder.fromXDR(response.signedTxXdr, NETWORK_PASSPHRASE);
    const sendResponse = await server.sendTransaction(txToSubmit as any);
    
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
        } else {
            throw new Error(`Transaction failed: ${JSON.stringify(txResponse)}`);
        }
    }
    throw new Error(`Failed to send tx: ${JSON.stringify(sendResponse)}`);
}
