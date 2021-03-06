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
                    defaultAccount: process.env.MAINNET_AION_DEV_ACCOUNT,
                    password: process.env.MAINNET_AION_ACCOUNT_PASSWORD,
                    privateKey: process.env.MAINNET_AION_ACCOUNT_PK
                },
                testnet: {
                    host: "https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=" + nodesmithApiKey,
                    defaultAccount: process.env.TESTNET_AION_DEV_ACCOUNT,
                    password: process.env.TESTNET_AION_ACCOUNT_PASSWORD,
                    privateKey: process.env.TESTNET_AION_ACCOUNT_PK
                },
                development: {
                    host: process.env.LOCAL_AION_HOST,
                    defaultAccount: process.env.LOCAL_AION_DEV_ACCOUNT,
                    password: process.env.LOCAL_AION_ACCOUNT_PASSWORD,
                    privateKey: process.env.LOCAL_AION_ACCOUNT_PK
                }
            }
        }
    }
};
