import { db } from "@/db";
import { getPineconeClient } from "@/lib/pinecone";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { PineconeStore } from "@langchain/pinecone";
import { NextRequest } from "next/server";
import { StreamingTextResponse } from "ai";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser,BytesOutputParser } from "@langchain/core/output_parsers";
import {llm} from "@/lib/gemini"


export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { getUser } = getKindeServerSession();
  const user = getUser();

  const { id: userId } = user;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { fileId, message } = SendMessageValidator.parse(body);

  

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  if (!file) {
    return new Response("NOT FOUND", { status: 404 });
  }

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY!,
    model: "gemini-embedding-001",
  });

  const pinecone = await getPineconeClient();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: file.id,
  });

  const retriever = vectorStore.asRetriever({ k: 3 });

  const results = await vectorStore.similaritySearch(message, 4);

  const prevMessage = await db.message.findMany({
    where: { fileId },
    orderBy: { createdAt: "asc" },
    take: 6,
  });

  const formattedPrevMessages = prevMessage.map((msg) => {
    return msg.isUserMessage
      ? `User: ${msg.text}`
      : `Assistant: ${msg.text}`;
  }).join("\n");

  const context = results.map((r) => r.pageContent).join("\n\n");

  const fullPrompt = `
Use the following pieces of context (or previous conversation if needed) to answer the user's question in markdown format.
If you don't know the answer, just say you don't know. Do not make up an answer.

----------------

PREVIOUS CONVERSATION:
${formattedPrevMessages}

----------------

CONTEXT:
${context}

USER INPUT: ${message}
`;

  // Set up Gemini with streaming enabled
  

  const outputParser = new BytesOutputParser();

  const stream = await llm
    .pipe(outputParser)
    .stream(fullPrompt);

  const streamWithCallback = new ReadableStream({
    async start(controller) {
      let fullCompletion = "";

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value as Uint8Array);
        fullCompletion += chunk;
        controller.enqueue(value);
      }

      controller.close();

      // Store the assistant message in DB after full stream
      await db.message.create({
        data: {
          text: fullCompletion,
          isUserMessage: false,
          userId,
          fileId,
        },
      });
    }
  });

  return new StreamingTextResponse(streamWithCallback);
};
