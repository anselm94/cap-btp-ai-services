# CAP ↔ BTP AI Service Integration

## Getting Started

1. **Clone the Repository**

   ```bash
   git clone https://github.com/anselm94/cap-btp-ai-services
   cd cap-btp-ai-services
   ```

2. **Install Dependencies**

   Ensure you have Node.js and npm installed. Then, run:

   ```bash
   npm install
   ```

3. **Bind CDS to an AI Core Instance**

   Use the CF CLI and login to the CF Space containing the `aicore` instance. And use CDS CLI to bind to this aicore instance to create a `hybrid` profile.

   ```bash
   cf login --sso # login into CF org & space

   cds bind -2 <aicore-instance-name> # bind CDS to BTP service instance
   ```

4. **Start the Watch Server**

   Launch the development server with:

   ```bash
   npm run watch
   ```

5. **Try out APIs**

   Open the [`test.http`](./test.http) file and try out APIs.

6. **Access the Application**  
   Open your browser and navigate to `http://localhost:4004` to access the application.

## License

[Apache 2.0](./LICENSE)
