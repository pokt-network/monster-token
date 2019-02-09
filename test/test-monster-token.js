let fs = require('fs')
let {
    compile,
    web3
} = require('./common.js')
let {
    expect
} = require('chai')

let monsterTokenSol = fs.readFileSync(`${process.cwd()}` + '/contracts/MonsterToken.sol', {
    encoding: 'utf8'
})

let TestUtils = require('./test-utils');

let monsterTokenABI;
let monsterTokenByteCode;
let monsterTokenAddress;
let monsterTokenInstance;

// Test Tavern information
let testTavernAddress = process.env.TEST_TAVERN_ADDRESS;
let testTavernInstance;
let TestTavernBolt = require('./Tavern.json');

// Quest instance
let questCreationTx;

describe('MonsterToken', () => {

    function getTestTavernInstance() {
        if (testTavernInstance) {
            return testTavernInstance;
        }

        testTavernInstance = new web3.eth.Contract(TestTavernBolt.abi, testTavernAddress, {
            from: web3.eth.defaultAccount,
            data: TestTavernBolt.bytecode
        });
        return testTavernInstance;
    }

    async function shouldCreateValidQuest(lat, lon, name, hint, maxWinners, metadata, txObject) {
        let initialQuestAmount = await getTestTavernInstance().methods.getQuestAmount(monsterTokenAddress).call(),
            merkleTree = TestUtils.generateMerkleTree(lat, lon),
            merkleBody = TestUtils.encodeMerkleBody(merkleTree);

        let txResult = await getTestTavernInstance().methods.createQuest(
            monsterTokenAddress,
            name,
            hint,
            maxWinners,
            '0x' + merkleTree.getRoot().toString('hex'),
            merkleBody,
            metadata
        )
        .send(txObject)
        .on('error', console.error);

        let finalQuestAmount = await getTestTavernInstance().methods.getQuestAmount(monsterTokenAddress).call();
        expect(finalQuestAmount).to.be.equal((new Number(initialQuestAmount) + 1).toString());
        return txResult;
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
            arguments: [web3.eth.defaultAccount, testTavernAddress],
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

    describe('#validateQuest', function () {
        it('should mark the quest valid with the correct parameters', async function () {
            questCreationTx = await shouldCreateValidQuest(
                40.6893,
                -74.0447,
                'This is a quest',
                'This is a hint',
                10,
                'some metadata', 
                {
                    from: web3.eth.defaultAccount,
                    gas: 2000000
                }
            );
            let questCreatedEvent = questCreationTx.events.QuestCreated;
            let questIndex = questCreatedEvent.returnValues._questIndex;
            let isQuestValid = await getTestTavernInstance().methods.getQuestValid(monsterTokenAddress, questIndex).call();
            expect(isQuestValid).to.be.ok;
        }).timeout(0);
    });

    // This test performs 2 steps: Does the client side work of stitching together the merkle tree,
    // and then submits the found proof to the contract.
    describe('#rewardCompletion', function () {
        it('should reward the user upon completion of the quest', async function () {
            let player = web3.eth.defaultAccount,
                questCreatedEvent = questCreationTx.events.QuestCreated,
                questIndex = questCreatedEvent.returnValues._questIndex,
                merkleBody = await getTestTavernInstance().methods.getQuestMerkleBody(monsterTokenAddress, questIndex).call(),
                playerSubmission = TestUtils.generatePlayerSubmission(40.6894, -74.0447, merkleBody);

            let submitProofTx = await getTestTavernInstance().methods.submitProof(
                monsterTokenAddress,
                questIndex,
                playerSubmission.proof,
                playerSubmission.answer,
                playerSubmission.order
            ).send({
                from: player,
                gas: 523804
            });

            expect(submitProofTx).to.be.ok;

            let isWinner = await getTestTavernInstance().methods.isWinner(monsterTokenAddress, questIndex, player).call();
            let isClaimer = await getTestTavernInstance().methods.isClaimer(monsterTokenAddress, questIndex, player).call();
            expect(isWinner).to.be.true;
            expect(isClaimer).to.be.true;
        }).timeout(0);
    });

    // This tests the "leaderboard" functionality getter methods
    describe('.tokenOwnersIndex', function () {
        it('should add the user to the leaderboard when they complete a quest', async function () {
            // Since in the past test we submitted a quest proof, the default account is already a winner
            let player = web3.eth.defaultAccount,
                questCreatedEvent = questCreationTx.events.QuestCreated,
                questIndex = questCreatedEvent.returnValues._questIndex;

            // Check that the player is listed as a winner and claimer of the quest
            let isWinner = await getTestTavernInstance().methods.isWinner(monsterTokenAddress, questIndex, player).call();
            let isClaimer = await getTestTavernInstance().methods.isClaimer(monsterTokenAddress, questIndex, player).call();
            expect(isWinner).to.be.true;
            expect(isClaimer).to.be.true;

            // Assert that player is in the leaderboard
            let ownersCount = await monsterTokenInstance.methods.getOwnersCount().call();
            expect(ownersCount).to.equal('1');

            let boardEntry = await monsterTokenInstance.methods.getOwnerTokenCountByIndex(questIndex).call();
            expect(boardEntry[0]).to.equal(player);
            // Now we check how many Monster Tokens the player holds
            // Since the player has completed just 1 quest, they will own exactly 1 Monster Token
            expect(boardEntry[1]).to.equal('1');
        }).timeout(0);
    });
});

