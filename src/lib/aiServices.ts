import { callCloudFunction, type CloudFnError } from "../lib/functions";

export type AiPrioritizeTasksRequest = {
  tasks: {
    id: string;
    title: string;
    dueAt?: string;
    estimateMinutes?: number;
  }[];
};

export type AiPrioritizeTasksResponse = {
  items: {
    taskId: string;
    title: string;
    reason: string;
    suggestedStart: string;
    suggestedMinutes: number;
  }[];
};

export async function callAiPrioritizeTasks(
  payload: AiPrioritizeTasksRequest
): Promise<AiPrioritizeTasksResponse> {
  return callCloudFunction<AiPrioritizeTasksRequest, AiPrioritizeTasksResponse>(
    "aiPrioritizeTasks",
    payload
  );
}

export type { CloudFnError };

