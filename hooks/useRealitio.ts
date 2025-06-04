import { useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import { REALITIO_ABI, REALITIO_ADDRESS } from '@/lib/contracts/realitio';
import { useQueryClient } from '@tanstack/react-query';
import { Hex } from 'viem';
import { useState, useCallback, useEffect } from 'react';

interface AskQuestionReturn {
  askQuestion: (templateId: bigint, question: string, arbitrator: `0x${string}`, timeout: number, openingTs: number, nonce: bigint, value?: bigint) => Promise<`0x${string}` | null>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  transactionHash: `0x${string}` | null;
  questionId: string | null;
}

export function useAskQuestion(onQuestionCreated?: (questionId: string) => void): AskQuestionReturn {
  const queryClient = useQueryClient();
  const [questionId, setQuestionId] = useState<string | null>(null);
  
  const { 
    data: txHash,
    writeContractAsync,
    isPending,
    isError,
    error,
  } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        queryClient.invalidateQueries({ queryKey: ['questions'] });
      },
    },
  });

  // Watch for LogNewQuestion event
  useWatchContractEvent({
    address: REALITIO_ADDRESS as `0x${string}`,
    abi: REALITIO_ABI,
    eventName: 'LogNewQuestion',
    onLogs: (logs) => {
      if (logs && logs.length > 0) {
        // @ts-ignore - TypeScript doesn't know about the event args
        const questionId = logs[0].args.question_id as string;
        setQuestionId(questionId);
        if (onQuestionCreated) {
          onQuestionCreated(questionId);
        }
      }
    },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const askQuestion = async (
    templateId: bigint,
    question: string,
    arbitrator: `0x${string}`,
    timeout: number,
    openingTs: number,
    nonce: bigint,
    value?: bigint
  ) => {
    if (!writeContractAsync) return null;
    
    try {
      const hash = await writeContractAsync({
        address: REALITIO_ADDRESS as `0x${string}`,
        abi: REALITIO_ABI,
        functionName: 'askQuestion',
        args: [templateId, question, arbitrator, timeout, openingTs, nonce],
        value: value || BigInt(0),
      });
      return hash;
    } catch (err) {
      console.error('Error asking question:', err);
      throw err;
    }
  };

  return {
    askQuestion,
    isLoading: isPending || isConfirming,
    isSuccess,
    isError,
    error,
    transactionHash: txHash || null,
    questionId,
  };
}
