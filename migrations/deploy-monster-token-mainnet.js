const AionWeb3 = require('aion-web3');
const NodesmithURL = 'https://api.nodesmith.io/v1/aion/mainnet/jsonrpc?apiKey=' + process.env.NODESMITH_API_KEY;
const MonsterTokenContractBuild = require('../build/bolts/MonsterToken.json');
const DeployerAccountPK = process.env.MAINNET_AION_ACCOUNT_PK;

if (!DeployerAccountPK) {
    throw new Error('Invalid private key, set your private key in the MAINNET_AION_ACCOUNT_PK env variable');
}

function getWeb3Instance() {
    const web3 = new AionWeb3(new AionWeb3.providers.HttpProvider(NodesmithURL));
    var account = web3.eth.accounts.privateKeyToAccount(DeployerAccountPK);
    web3.eth.defaultAccount = account.address;
    web3.eth.accounts.wallet.add(account);
    return web3;
}

async function deployContract() {
    const web3 = getWeb3Instance();
    const MonsterToken = new web3.eth.Contract(MonsterTokenContractBuild.abi, {
        from: web3.eth.defaultAccount,
        data: MonsterTokenContractBuild.bytecode
    });

    if (!MonsterToken) {
        throw new Error('Error parsing the Tavern contract build file');
    }

    const monsterTokenInstanceGasEstimate = await MonsterToken.deploy({
        arguments: [web3.eth.defaultAccount]
    }).estimateGas({
        from: web3.eth.defaultAccount,
        gas: 5000000
    });

    console.log("Gas estimate: " + monsterTokenInstanceGasEstimate);

    const monsterTokenInstance = await MonsterToken.deploy({
        arguments: [web3.eth.defaultAccount]
    }).send({
        from: web3.eth.defaultAccount,
        gas: 5000000
    });

    if (!monsterTokenInstance) {
        throw new Error('An error ocurred during deployment');
    }

    console.log(monsterTokenInstance.options.address);
}

deployContract();
