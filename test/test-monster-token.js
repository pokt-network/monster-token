let fs = require('fs');
let TestUtils = require('./test-utils');
const {
    expect
} = require('chai');
let {
    compile,
    web3
} = require('./common.js');
let monsterTokenSol = fs.readFileSync(`${process.cwd()}` + '/contracts/MonsterToken.sol', {
    encoding: 'utf8'
});

// Test state
let monsterTokenABI;
let monsterTokenByteCode;
let monsterTokenAddress;
let monsterTokenInstance;

describe('MonsterToken', () => {

    it('should compile contract', async () => {
        let {
            MonsterToken
        } = await compile(web3, monsterTokenSol)
        monsterTokenABI = MonsterToken.info.abiDefinition
        monsterTokenByteCode = MonsterToken.code
        expect(monsterTokenABI).to.not.be.null
        expect(monsterTokenABI).to.be.an('array')
        expect(monsterTokenByteCode).to.not.be.null
        expect(monsterTokenByteCode).to.be.an('string')
    }).timeout(0)

    it('should deploy the contract', async () => {
        var MonsterTokenContract = new web3.eth.Contract(monsterTokenABI, {
            from: web3.eth.defaultAccount,
            data: monsterTokenByteCode
        });

        monsterTokenInstance = await MonsterTokenContract.deploy({
            arguments: [web3.eth.defaultAccount],
            data: monsterTokenByteCode
        }).send({
            from: web3.eth.defaultAccount,
            gas: 5000000
        });
        monsterTokenAddress = monsterTokenInstance.options.address;
        expect(monsterTokenInstance).to.not.be.null;
        expect(monsterTokenAddress).to.not.be.null;
    }).timeout(0);

    describe('#constructor', function () {
        it('should create a MonsterToken instance with the right owner', async function () {
            let monsterTokenOwner = await monsterTokenInstance.methods.owner().call();
            expect(monsterTokenOwner).to.be.equal(web3.eth.defaultAccount);
        }).timeout(0);
    });

    describe('#submitChase', function () {
        it('should create a Chase with valid parameters', async function () {
            let merkleTree = TestUtils.generateMerkleTree(40.6893, -74.0447),
                merkleBody = TestUtils.encodeMerkleBody(merkleTree),
                maxGas = 2000000;

            let chaseCreationResultTx = await monsterTokenInstance.methods.submitChase(
                web3.eth.defaultAccount,
                'Pirulo Hernandez',
                'The father of all Pirulos',
                0,
                'FDFFFB,46.22333414526491,6.136932945194016,46.22333414526491,6.140530231617691,46.22693143168858,6.136932945194016,46.22693143168858,6.140530231617691',
                '0x' + merkleTree.getRoot().toString('hex'),
                merkleBody
            )
            .send({
                from: web3.eth.defaultAccount,
                gas: maxGas
            })
            .on('error', console.error);

            expect(chaseCreationResultTx).to.be.ok;
            expect(chaseCreationResultTx.cumulativeGasUsed).to.be.lessThan(maxGas);
            expect(chaseCreationResultTx.status).to.be.true;
        }).timeout(0);
    });
});

