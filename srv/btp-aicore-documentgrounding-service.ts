import { semanticSearch } from "#cds-models/BTPAICoreDocumentGroundingService";
import { VectorApi } from "@sap-ai-sdk/document-grounding";
import cds from "@sap/cds";

export class BTPAICoreDocumentGroundingService extends cds.ApplicationService {
  async init() {
    /**
     * Semantic search via Document Grounding client
     */
    this.on(semanticSearch, async (req) => {
      const { text } = req.data;
      if (!text) return req.reject(400, "Missing required parameters");

      const resVectorSearch = await VectorApi.search(
        {
          query: text,
          filters: [
            {
              id: "vector-search",
              collectionIds: [
                "5461fabc-b8dd-4a2c-990b-73943d4a3847", // paul-graham-essays
              ],
              configuration: {},
            },
          ],
        },
        {
          "AI-Resource-Group": "default",
        }
      ).execute();

      // maps vector search result containing results from multiple collections -> multiple documents -> multiple chunks
      const resOut =
        resVectorSearch.results.length > 0
          ? resVectorSearch.results[0].results.reduce(
              (acc, curr) =>
                acc.concat(
                  curr.documents.reduce(
                    (acc1, curr1) =>
                      acc1.concat(...curr1.chunks.map((c) => c.content)),
                    [] as string[]
                  )
                ),
              [] as string[]
            )
          : [];

      return req.reply(resOut);
    });

    return super.init();
  }
}
