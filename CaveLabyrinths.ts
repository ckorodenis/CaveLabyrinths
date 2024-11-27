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
const PRICE = 100_000_000_000 as u64; // 0.1 MAS
const BURN_ADDRESS = "0000000000000000000000000000000000000000000000000000";

// Adresa vlastníka kontraktu
const CONTRACT_OWNER = "AU125B4vA84Fbq4kAs5fX15JJ3AkUneA3YKDyJseQxv7Cmv9EDSc6";

// Initialize storage
export function constructor(): void {
  setCounter("CaveCounter", 0);
  setCounter("KeyCounter", 0);
}

// Funkce pro veřejné mintování NFT
export function mintNFT(): void {
  const payment = Context.transferredCoins();
  const caller = Context.caller();

  if (caller.toString() === CONTRACT_OWNER) {
    console.log("Minting NFT for contract owner without charge.");
  } else {
    assert(payment >= PRICE, "Insufficient payment. At least 0.1 MAS is required.");
  }

  mintProcess(caller.toString());
}

// Funkce pro mintování NFT vlastníkem zdarma (bezplatné mintování)
export function mintForOwner(): void {
  const caller = Context.caller();
  assert(caller.toString() === CONTRACT_OWNER, "Only the contract owner can mint for free.");
  mintProcess(caller.toString());
}

// Proces mintování NFT
function mintProcess(callerAddress: string): void {
  let caveCounter = getCounter("CaveCounter");
  let keyCounter = getCounter("KeyCounter");

  assert(caveCounter < (MAX_CAVE_NFT as u64), "All CaveLabyrints NFTs have been minted.");
  assert(keyCounter < (MAX_KEY_NFT as u64) || caveCounter % 2 !== 0, "All LabyrintsKeys NFTs have been minted.");

  // Mint CaveLabyrints NFT
  caveCounter++;
  const caveMetadata = `${NUMBER_KEY}: #${caveCounter}, ${STATUS_KEY}: ${LOCKED_STATUS}, ${GEMSTONE_KEY}: ${getRandomGemstone()}`;
  Storage.set(stringToBytes(`${NFT_CAVE_KEY}_${caveCounter}`), stringToBytes(caveMetadata));
  generateEvent(`Minted CaveLabyrints #${caveCounter} for ${callerAddress}. Metadata: ${caveMetadata}`);

  // Mint LabyrintsKeys NFT only for even CaveLabyrints
  if (caveCounter % 2 === 0) {
    keyCounter++;
    const keyMetadata = `${NUMBER_KEY}: #${keyCounter}`;
    Storage.set(stringToBytes(`${NFT_KEY_KEY}_${keyCounter}`), stringToBytes(keyMetadata));
    generateEvent(`Minted LabyrintsKeys #${keyCounter} for ${callerAddress}. Metadata: ${keyMetadata}`);
    setCounter("KeyCounter", keyCounter);
  }

  setCounter("CaveCounter", caveCounter);
}

// Funkce pro odemykání jeskyní
export function unlockCave(caveNumber: u64): void {
  const caveKey = `${NFT_CAVE_KEY}_${caveNumber}`;
  assert(Storage.has(stringToBytes(caveKey)), "CaveLabyrints NFT does not exist.");
  
  const caveMetadata = bytesToString(Storage.get(stringToBytes(caveKey)));
  assert(caveMetadata.includes(`${STATUS_KEY}: ${LOCKED_STATUS}`), "This CaveLabyrints is already unlocked.");

  // Burn LabyrintsKeys NFT
  let keyCounter = getCounter("KeyCounter");
  assert(keyCounter > 0, "No LabyrintsKeys NFTs available to burn.");
  
  const keyToBurn = `${NFT_KEY_KEY}_${keyCounter}`;
  assert(Storage.has(stringToBytes(keyToBurn)), "LabyrintsKeys NFT does not exist.");

  // Remove key from storage and generate burn event
  Storage.del(stringToBytes(keyToBurn));
  generateEvent(`Burned LabyrintsKeys #${keyCounter} from ${Context.caller().toString()} to burn address ${BURN_ADDRESS}.`);

  // Update CaveLabyrints metadata
  const updatedMetadata = caveMetadata.replace(`${STATUS_KEY}: ${LOCKED_STATUS}`, `${STATUS_KEY}: ${UNLOCKED_STATUS}`);
  Storage.set(stringToBytes(caveKey), stringToBytes(updatedMetadata));
  generateEvent(`Unlocked CaveLabyrints #${caveNumber}. Metadata: ${updatedMetadata}`);

  setCounter("KeyCounter", keyCounter - 1);
}

// Helper function to get a random gemstone
function getRandomGemstone(): string {
  const gemstones = ["I", "II", "III", "IIII", "IIIII"];
  const randomIndex: i32 = Math.floor(Math.random() * gemstones.length) as i32;
  return gemstones[randomIndex];
}

// Helper functions for counter management
function getCounter(counterName: string): u64 {
  if (!Storage.has(stringToBytes(counterName))) {
    return 0;
  }
  return bytesToU64(Storage.get(stringToBytes(counterName)));
}

function setCounter(counterName: string, value: u64): void {
  Storage.set(stringToBytes(counterName), u64ToBytes(value));
}