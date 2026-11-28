import type { AiAnalysisResult, AiAnalyzeRequest } from '../types/ai';
import { apiRequest } from './client';

export function analyzeEntryWithAi(
  payload: AiAnalyzeRequest,
): Promise<{ analysis: AiAnalysisResult }> {
  return apiRequest<{ analysis: AiAnalysisResult }>('/ai/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
