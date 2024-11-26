------------------------------------------------------------------------

1. Minting NFT (mintNFT)

Conditions: the player must send 250 MAS.

Output:
Generates a CaveLabyrints NFT with a unique serial number, Locked status, and a random Gemstone.
Generates a LabyrintsKeys NFT with a unique serial number.

Metadata:
CaveLabyrints contains: Number, Status, Gemstone.
LabyrintsKeys contains: Number.

Limitations:
Max 1000 CaveLabyrints and 500 LabyrintsKeys.

------------------------------------------------------------------------

2. Unlocking NFT CaveLabyrints (unlockCave)

Conditions: The player must own a specific CaveLabyrints NFT and one LabyrintsKeys NFT.

The CaveLabyrints must have a Locked state.

Process:
LabyrintsKeys NFT is destroyed (sent to the burn address).
The state of the selected CaveLabyrints is updated to Unlocked.

Output: the player can enter their unlocked CaveLabyrints.

------------------------------------------------------------------------

3. Auxiliary functions
Random Gemstone Selection (getRandomGemstone): assigns a random Gemstone (I, II, III, IIII, IIIII) to each CaveLabyrints NFT.
Retrieve Gemstone (getGemstoneFromMetadata): Returns the value of the gemstone from the stored metadata of the NFT.
