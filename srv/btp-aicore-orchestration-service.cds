using com.sap.example.capbtpai from '../db/schema';

service BTPAICoreOrchestrationService {
    type JSON : String;
    action extractCV(cv : String)                            returns Map;
    action translate(text : String, targetLanguage : String) returns String;
    action execWorkflow(inputParams : JSON)                  returns String;
}
