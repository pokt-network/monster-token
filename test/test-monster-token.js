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

// Constants
let MAX_GAS = 2000000;

// Test state
let monsterTokenABI;
let monsterTokenByteCode;
let monsterTokenAddress;
let monsterTokenInstance;

describe('MonsterToken', () => {

    async function createValidChase(lat, lon, name, hint, maxWinners, metadata) {
        let merkleTree = TestUtils.generateMerkleTree(lat, lon),
            merkleBody = TestUtils.encodeMerkleBody(merkleTree);

        let chaseCreationResultTx = await monsterTokenInstance.methods.submitChase(
                web3.eth.defaultAccount,
                name,
                hint,
                maxWinners,
                metadata,
                '0x' + merkleTree.getRoot().toString('hex'),
                merkleBody
            )
            .send({
                from: web3.eth.defaultAccount,
                gas: MAX_GAS
            })
            .on('error', console.error);

        expect(chaseCreationResultTx).to.be.ok;
        expect(chaseCreationResultTx.cumulativeGasUsed).to.be.lessThan(MAX_GAS);
        expect(chaseCreationResultTx.status).to.be.true;
        return chaseCreationResultTx;
    }

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
        console.log("CONTRACT ADDRESS:" + monsterTokenAddress);
    }).timeout(0);

    describe('#constructor', function () {
        it('should create a MonsterToken instance with the right owner', async function () {
            let monsterTokenOwner = await monsterTokenInstance.methods.owner().call();
            expect(monsterTokenOwner).to.be.equal(web3.eth.defaultAccount);
        }).timeout(0);
    });

    describe('#submitChase', function () {
        it('should create a Chase with valid parameters', async function () {
            await createValidChase(18.4513, -69.9563, 'Pirulo Hernandez', 'The father of all Pirulos', 0, 'FDFFFB,46.22333414526491,6.136932945194016,46.22333414526491,6.140530231617691,46.22693143168858,6.136932945194016,46.22693143168858,6.140530231617691');
            var chaseAmount = await monsterTokenInstance.methods.getChaseAmount().call();
            expect(chaseAmount).to.be.equal('1');
        }).timeout(0);
    });

    describe('#getChaseHeader', function() {
        it('should retrieve a chase creator, name, hint, maxWinners, metadata and validity', async function () {
            let chaseHeader = await monsterTokenInstance.methods.getChaseHeader(0).call();
            Object.keys(chaseHeader).forEach(function(key) {
                expect(chaseHeader[key]).to.be.ok;
            });
        }).timeout(0);
    });

    describe('#getChaseDetail', function () {
        it('should retrieve a chase merkle root, merkle body and current winners amount', async function () {
            let chaseDetail = await monsterTokenInstance.methods.getChaseDetail(0).call();
            Object.keys(chaseDetail).forEach(function (key) {
                expect(chaseDetail[key]).to.be.ok;
            });
        }).timeout(0);
    });

    describe('#submitProof', function() {
        it('should submit proof for an already existing chase', async function () {
            let merkleBody = await monsterTokenInstance.methods.chaseMerkleBodies(0).call(),
                playerSubmission = TestUtils.generatePlayerSubmission(18.4513, -69.9563, merkleBody);

            console.log(playerSubmission.proof);
            console.log(playerSubmission.answer);
            console.log(playerSubmission.order);

            let submitProofTx = await monsterTokenInstance.methods.submitProof(
                web3.eth.defaultAccount,
                0,
                playerSubmission.proof,
                playerSubmission.answer,
                playerSubmission.order
            ).send({
                from: web3.eth.defaultAccount,
                gas: MAX_GAS
            });

            let isWinner = await monsterTokenInstance.methods.isWinner(0, web3.eth.defaultAccount).call(),
                tokensOwned = await monsterTokenInstance.methods.balanceOf(web3.eth.defaultAccount).call();

            expect(submitProofTx.status).to.be.true;
            expect(submitProofTx.gasUsed).to.be.lessThan(MAX_GAS);
            expect(submitProofTx.events.Transfer).to.be.ok;
            expect(isWinner).to.be.true;
            expect(tokensOwned).to.equal('1');
        }).timeout(0);
    });
});

