import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import env from '../../config/env';
import logger from '../../utils/logger';

const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
// Same as Doc-review: models/gemini-2.5-flash
const DEFAULT_MODEL = 'models/gemini-2.5-flash';

/**
 * Generate a short summary of document content (Vercel AI SDK + Gemini).
 */
export async function generateSummary(documentTitle: string, documentText: string): Promise<string> {
  if (!documentText.trim()) {
    return 'No extractable text in this document.';
  }
  try {
    const { text } = await generateText({
      model: google(DEFAULT_MODEL),
      system: `You are a concise document analyst. Summarize the given document in 2–4 short paragraphs of plain prose. Use only normal sentences and punctuation—no markdown, no asterisks, no bullet points, no bold or headers. Write like a human would in a brief note. Do not add preamble or meta-commentary.`,
      prompt: `Document title: ${documentTitle}\n\nContent:\n${documentText.slice(0, 120_000)}`,
      maxOutputTokens: 1024,
    });
    return (text || '').trim();
  } catch (err) {
    logger.error('Vercel AI generateSummary error:', err);
    throw err;
  }
}

/**
 * Stream an answer to a user question about document content (for useChat-style UX).
 * Pipes the text stream to the provided Node.js ServerResponse.
 * Errors before streaming starts are caught by the controller (which only sends 500 when headers not yet sent).
 */
export async function streamDocumentAnswerToResponse(
  documentTitle: string,
  documentText: string,
  userQuestion: string,
  res: import('express').Response
): Promise<void> {
  if (!documentText.trim()) {
    throw new Error('No extractable text in this document.');
  }
  const result = streamText({
    model: google(DEFAULT_MODEL),
    system: `You are a helpful assistant answering questions about a single document. Use only the document content below. If the answer is not in the document, say so briefly. Reply in plain prose only—no markdown, no asterisks, no bullet points or bold. Be concise.`,
    prompt: `Document title: ${documentTitle}\n\nContent:\n${documentText.slice(0, 120_000)}\n\n---\n\nUser question: ${userQuestion}`,
    maxOutputTokens: 2048,
  });
  result.pipeTextStreamToResponse(res);
  // Note: pipeTextStreamToResponse is fire-and-forget; controller only sends 500 when !res.headersSent
}
