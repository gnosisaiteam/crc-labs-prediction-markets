export const REALITIO_ADDRESS = '0x79e32aE03fb27B07C89c0c568F80287C01ca2E57';

export const REALITIO_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "template_id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "question",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "arbitrator",
        "type": "address"
      },
      {
        "internalType": "uint32",
        "name": "timeout",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "opening_ts",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "nonce",
        "type": "uint256"
      }
    ],
    "name": "askQuestion",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // Add other necessary functions here
] as const;
