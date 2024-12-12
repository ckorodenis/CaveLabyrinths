import { Storage, generateEvent, Context } from "@massalabs/massa-as-sdk";
import { Args, stringToBytes, bytesToString, u64ToBytes, bytesToU64 } from "@massalabs/as-types";

// Metadata keys
const NUMBER_KEY = "Number";
const STATUS_KEY = "Status";
const GEMSTONE_KEY = "Gemstone";
const LOCKED_STATUS = "Locked";
const UNLOCKED_STATUS = "Unlocked";

// Constants
const NFT_CAVE_KEY = "CaveLabyrints";
const NFT_KEY_KEY = "LabyrintsKeys";
const MAX_CAVE_NFT = 1000;
const MAX_KEY_NFT = 500;
const PRICE = 100_000_000_000 as u64; // 0.1 MAS in native units
const UNLOCK_FEE = 50_000_000_000 as u64; // 0.05 MAS unlock fee

// Initialize storage with dynamic owner
export function constructor(): void {
  const owner = Context.caller().toString();
  Storage.set(stringToBytes("Owner"), stringToBytes(owner));
  setCounter("CaveCounter", 0);
  setCounter("KeyCounter", 0);
}

// Mint NFT function
export function mintNFT(): void {
  const payment = Context.transferredCoins();
  const caller = Context.caller();
  const owner = bytesToString(Storage.get(stringToBytes("Owner")));

  // Free mint for the contract owner
  if (caller.toString() === owner) {
    console.log("Minting NFT for contract owner without charge.");
  } else {
    assert(payment >= PRICE, "Insufficient payment, 0.1 MAS required.");
  }

  let caveCounter = getCounter("CaveCounter");
  let keyCounter = getCounter("KeyCounter");

  assert(caveCounter < (MAX_CAVE_NFT as u64), "All CaveLabyrints NFTs have been minted.");
  assert(keyCounter < (MAX_KEY_NFT as u64) || caveCounter % 2 !== 0, "All LabyrintsKeys NFTs have been minted.");

  // Mint CaveLabyrints NFT
  caveCounter++;
  const caveMetadata = `${NUMBER_KEY}: #${caveCounter}, ${STATUS_KEY}: ${LOCKED_STATUS}, ${GEMSTONE_KEY}: ${getRandomGemstone()}`;
  const caveKey = `${NFT_CAVE_KEY}_${caveCounter}_${caller.toString()}`;
  Storage.set(stringToBytes(caveKey), stringToBytes(caveMetadata));
  generateEvent(`Minted CaveLabyrints #${caveCounter} for ${caller.toString()}. Metadata: ${caveMetadata}`);

  // Mint LabyrintsKeys NFT only for even CaveLabyrints
  if (caveCounter % 2 === 0) {
    keyCounter++;
    const keyMetadata = `${NUMBER_KEY}: #${keyCounter}`;
    const keyKey = `${NFT_KEY_KEY}_${keyCounter}_${caller.toString()}`;
    Storage.set(stringToBytes(keyKey), stringToBytes(keyMetadata));
    generateEvent(`Minted LabyrintsKeys #${keyCounter} for ${caller.toString()}. Metadata: ${keyMetadata}`);
    setCounter("KeyCounter", keyCounter);
  }

  setCounter("CaveCounter", caveCounter);
}

// Unlock CaveLabyrints
export function unlockCave(caveNumber: u64): void {
  const payment = Context.transferredCoins();
  assert(payment >= UNLOCK_FEE, "Insufficient fee for unlocking CaveLabyrints.");

  const caller = Context.caller();
  const caveKey = `${NFT_CAVE_KEY}_${caveNumber}_${caller.toString()}`;
  assert(Storage.has(stringToBytes(caveKey)), "CaveLabyrints NFT does not exist or is not owned by the caller.");

  const caveMetadata = bytesToString(Storage.get(stringToBytes(caveKey)));
  assert(caveMetadata.includes(`${STATUS_KEY}: ${LOCKED_STATUS}`), "This CaveLabyrints is already unlocked.");

  // Burn LabyrintsKeys NFT
  let keyCounter = getCounter("KeyCounter");
  assert(keyCounter > 0, "No LabyrintsKeys NFTs available to burn.");

  const keyToBurn = `${NFT_KEY_KEY}_${keyCounter}_${caller.toString()}`;
  assert(Storage.has(stringToBytes(keyToBurn)), "LabyrintsKeys NFT does not exist or is not owned by the caller.");

  // Remove key from storage and generate burn event
  Storage.del(stringToBytes(keyToBurn));
  generateEvent(`Burned LabyrintsKeys #${keyCounter} from ${caller.toString()}.`);

  // Update CaveLabyrints metadata
  const updatedMetadata = caveMetadata.replace(`${STATUS_KEY}: ${LOCKED_STATUS}`, `${STATUS_KEY}: ${UNLOCKED_STATUS}`);
  Storage.set(stringToBytes(caveKey), stringToBytes(updatedMetadata));
  generateEvent(`Unlocked CaveLabyrints #${caveNumber}. Metadata: ${updatedMetadata}`);

  setCounter("KeyCounter", keyCounter - 1);
}

// Helper function to get a pseudo-random gemstone
function getRandomGemstone(): string {
  const gemstones = ["I", "II", "III", "IIII", "IIIII"];
  const randomIndex = (Context.timestamp() + Context.caller().toString().length) % gemstones.length;
  return gemstones[randomIndex];
}

// Helper functions for counter management
function getCounter(counterName: string): u64 {
  return bytesToU64(Storage.get(stringToBytes(counterName)));
}

function setCounter(counterName: string, value: u64): void {
  Storage.set(stringToBytes(counterName), u64ToBytes(value));
}
