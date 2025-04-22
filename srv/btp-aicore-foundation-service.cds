using com.sap.example.capbtpai from '../db/schema';

service BTPAICoreFoundationService {
    action chatCompletion(text : String) returns String;
    action embedding(text : String)      returns Vector;
}
