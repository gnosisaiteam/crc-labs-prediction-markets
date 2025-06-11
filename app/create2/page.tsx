"use client"

import { WalletConnectButton } from "@/components/wallet-connect-button";
import { ERC20_ABI } from "@/lib/contracts/erc20";
import { config } from "@/lib/wagmi/config";
import { formatUnits } from "viem";
import { useReadContract, useAccount } from "wagmi";
import { Button } from "@/components/ui/button";

const tokenAddress: `0x${string}` = '0xaf204776c7245bF4147c2612BF6e5972Ee483701' // DAI token on Ethereum mainnet
const tokenDecimals = 18

export default function BalancePage() {
    const { address } = useAccount({ config });

    const clickFunc = () => {
        console.log("inside clickFunc");
        refetch();
        console.log("done");
    };

    // Define the balanceOf function type explicitly
    const balanceOfAbi = [
        {
            "constant": true,
            "inputs": [{ "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "", "type": "uint256" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;

    const { data: balance, isPending, error, status, refetch } = useReadContract({
        config,
        abi: balanceOfAbi,
        address: tokenAddress,
        functionName: 'balanceOf',
        args: address ? [address as `0x${string}`] as const : undefined,
        query: {
            enabled: !!address,
        },
    });

    // Log balance and errors
    console.log('Balance data:', balance);
    console.log('Error:', error);

    return (
        <div className="p-4">
            <div className="mb-4">
                <WalletConnectButton />
            </div>
            <h1 className="text-2xl font-bold mb-4">ERC20 Balance</h1>

            <div className="space-y-2">

                <p className="font-mono">Address: {address || 'Not connected'}</p>
                <p className="font-mono">Token: {tokenAddress}</p>

                

                {isPending ? (
                    <p>Loading balance...</p>
                ) : error ? (
                    <p className="text-red-500">Error: {error.message}</p>
                ) : (
                    <p className="font-mono">
                        Balance: {balance ? formatUnits(balance as bigint, tokenDecimals) : '0'}
                    </p>
                )}
            </div>
            <Button variant="outline" onClick={clickFunc}>Approve</Button>
        </div>
    );
}