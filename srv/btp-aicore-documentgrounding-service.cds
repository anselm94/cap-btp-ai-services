using com.sap.example.capbtpai from '../db/schema';

service BTPAICoreDocumentGroundingService {
    action semanticSearch(text : String) returns array of String;
}
