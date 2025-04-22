import cds from "@sap/cds";
import {
  execWorkflow,
  extractCV,
  translate,
} from "#cds-models/BTPAICoreOrchestrationService";
import {
  buildAzureContentSafetyFilter,
  buildDpiMaskingProvider,
  buildLlamaGuardFilter,
  OrchestrationClient,
} from "@sap-ai-sdk/orchestration";
import z from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export class BTPAICoreOrchestrationService extends cds.ApplicationService {
  async init() {
    /**
     * A simple Orchestration configuration to translate an input parameter text to a target language.
     */
    this.on(translate, async (req) => {
      const { text, targetLanguage } = req.data;
      if (!text || !targetLanguage)
        return req.reject(400, "Missing required parameters");

      const aicoreOrchClient = new OrchestrationClient({
        // llm configuration - any model is supported
        llm: {
          model_name: "mistralai--mistral-large-instruct",
        },
        // basic templating configuration with placeholders
        templating: {
          template: [
            {
              role: "user",
              content:
                "Translate the following text to the target language - {{?targetLanguage}}.\n\n{{?text}}",
            },
          ],
        },
      });

      const resOrch = await aicoreOrchClient.chatCompletion({
        inputParams: { text, targetLanguage },
        messagesHistory: [],
      });

      return req.reply(resOrch.getContent());
    });

    /**
     * A detailed Orchestration configuration with structured JSON output. Also
     * has data masking, content input/output filtering.
     */
    this.on(extractCV, async (req) => {
      const { cv } = req.data;
      if (!cv) return req.reject(400, "Missing required parameters");

      const schemaCV = z.object({
        name: z.string().describe("Name of the candidate"),
        email: z.string().describe("Email of the candidate"),
        phone: z.string().describe("Phone number of the candidate"),
        contact: z.string().describe("Contact address of the candidate"),
        summary: z.string().describe("Summary/Intro of the candidate"),
        education: z
          .array(
            z.object({
              degree: z.string().describe("Degree obtained"),
              institution: z.string().describe("Institution name"),
              year: z.string().describe("Year of graduation"),
            })
          )
          .describe("Education details of the candidate"),
        skills: z.array(z.string()).describe("Skills of the candidate"),
        experience: z
          .array(
            z.object({
              company: z.string().describe("Company name"),
              role: z.string().describe("Role in the company"),
              duration: z.string().describe("Duration of employment"),
              responsibilities: z.string().describe("Responsibilities held"),
            })
          )
          .describe("Work experience of the candidate"),
        interests: z
          .array(z.string())
          .describe("Personal interests of the candidate"),
        certifications: z
          .array(z.string())
          .describe("Certifications of the candidate"),
        projects: z
          .array(
            z.object({
              title: z.string().describe("Project title"),
              description: z.string().describe("Project description"),
              year: z.string().describe("Year of the project"),
            })
          )
          .describe("Projects undertaken by the candidate"),
      });

      const aicoreOrchClient = new OrchestrationClient({
        // llm configuration - all models which support structured outputs
        llm: {
          model_name: "gemini-1.5-flash",
        },
        // templating configuration with placeholders and structured output schema
        templating: {
          template: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant for HR. Extract the key information from a candidates resume as JSON",
            },
            {
              role: "user",
              content: "Candidate Resume:\n{{?candidate_resume}}",
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "candidate_resume",
              strict: true,
              schema: zodToJsonSchema(schemaCV),
            },
          },
        },
        // masking configuration for psudonymization
        masking: {
          masking_providers: [
            buildDpiMaskingProvider({
              method: "pseudonymization",
              entities: [
                "profile-person",
                "profile-email",
                "profile-phone",
                "profile-org",
                "profile-location",
              ],
            }),
          ],
        },
        // input filtering using LlamaGuard
        // output filtering using Azure Content Safety
        filtering: {
          input: {
            filters: [
              buildLlamaGuardFilter(
                "hate",
                "self_harm",
                "sexual_content",
                "violent_crimes"
              ),
            ],
          },
          output: {
            filters: [
              buildAzureContentSafetyFilter({
                Hate: "ALLOW_ALL",
                SelfHarm: "ALLOW_SAFE",
                Sexual: "ALLOW_SAFE_LOW_MEDIUM",
                Violence: "ALLOW_SAFE_LOW_MEDIUM",
              }),
            ],
          },
        },
      });

      const resOrch = await aicoreOrchClient.chatCompletion({
        inputParams: { candidate_resume: cv },
        messagesHistory: [],
      });

      return req.reply(JSON.parse(resOrch.getContent() as string));
    });

    /**
     * A simple Orchestration configuration using the exported JSON from
     * the Workflow UI.
     */
    this.on(execWorkflow, async (req) => {
      const { inputParams } = req.data;
      if (!inputParams) return req.reject(400, "Missing required parameters");

      const parsedParams = JSON.parse(inputParams) as Record<string, string>;

      // Workflow configuration JSON as exported from Workflow UI
      const aicoreWorkflowConfig = `{
        "module_configurations": {
            "llm_module_config": {
              "model_name": "gpt-4o",
              "model_params": {},
              "model_version": "2024-08-06"
            },
            "templating_module_config": {
                "template_ref": {
                  "id": "feb27b04-f5fd-4bcb-b081-938bb452d522"
                }
            }
        }
      }`;

      const aicoreOrchClient = new OrchestrationClient(aicoreWorkflowConfig);

      const resOrch = await aicoreOrchClient.chatCompletion({
        inputParams: parsedParams,
      });

      const parsedJson = extractJsonFromMarkdown(
        resOrch.getContent() as string
      );

      return req.reply(JSON.parse(parsedJson));
    });

    return super.init();
  }
}

function extractJsonFromMarkdown(markdown: string): string {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = markdown.match(jsonRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return "{}"; // Return an empty JSON object if no match is found
}
