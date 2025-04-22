import {
  chatCompletion,
  embedding,
} from "#cds-models/BTPAICoreFoundationService";
import {
  AzureOpenAiChatClient,
  AzureOpenAiEmbeddingClient,
} from "@sap-ai-sdk/foundation-models";
import cds from "@sap/cds";

export class BTPAICoreFoundationService extends cds.ApplicationService {
  async init() {
    const openaiChatClient = new AzureOpenAiChatClient("gpt-4o");
    const openaiEmbeddingClient = new AzureOpenAiEmbeddingClient(
      "text-embedding-3-small"
    );

    /**
     * Chat completion generation via OpenAI client
     */
    this.on(chatCompletion, async (req) => {
      const { text } = req.data;
      if (!text) return req.reject(400, "Missing required parameters");

      const resOrch = await openaiChatClient.run({
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      });

      return req.reply(resOrch.getContent());
    });

    /**
     * Text embedding generation via OpenAI client
     */
    this.on(embedding, async (req) => {
      const { text } = req.data;
      if (!text) return req.reject(400, "Missing required parameters");

      const resOrch = await openaiEmbeddingClient.run({
        input: text,
      });

      return req.reply(resOrch.getEmbedding());
    });

    return super.init();
  }
}
