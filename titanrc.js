let nodesmithApiKey = process.env.NODESMITH_API_KEY;
if (!nodesmithApiKey) {
    throw new Error("NODESMITH_API_KEY is not valid! Check your titanrc.js file!");
}

module.exports = {
    defaultBlockchain: "aion",
    blockchains: {
        aion: {
            networks: {
                mainnet: {
                    host: "https://api.nodesmith.io/v1/aion/mainnet/jsonrpc?apiKey=" + nodesmithApiKey,
                    defaultAccount: "",
                    password: ""
                },
                testnet: {
                    host: "https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=" + nodesmithApiKey,
                    defaultAccount: "",
                    password: ""
                },
                development: {
                    host: "https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=" + nodesmithApiKey,
                    defaultAccount: process.env.DEFAULT_AION_ACCOUNT,
                    password: "",
                    privateKey: process.env.DEFAULT_AION_PK
                }
            }
        }
    }
};