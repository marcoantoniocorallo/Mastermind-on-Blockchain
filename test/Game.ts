import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployFixture } from "./Fixtures";
import { compute_gas, expect_eq, hash, Color, toNum } from "./Utils";

describe("Play Game Tests", function () {
    it("Test1 : A guess is sent", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[0];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
            .to.emit(contract, "GuessSent")
            .withArgs(codebreaker.address);

    });

    it("Test2 : Two guesses are sent - revert bcs there is no feedback in between", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[0];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
            .to.emit(contract, "GuessSent")
            .withArgs(codebreaker.address);

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
            .to.be.revertedWith("Operation not allowed now.");

    });

    it("Test3 : Guess sent by codemaker - revert", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[0];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codemaker).sendGuess(code, 0))
            .to.be.revertedWith("Denied operation.");
    });

    it("Test4 : Guess and feedback", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[0];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
            .to.emit(contract, "GuessSent")
            .withArgs(codebreaker.address);

        await expect(contract.connect(codemaker).sendFeedback(4, 0, 0))
            .to.emit(contract, "FeedbackSent")
            .withArgs(codemaker.address);
    });

    it("Test5 : N_GUESSES Guess and feedback", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[0];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(codebreaker.address);

        await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.be.revertedWith("Operation not allowed now.");

    });

    it("Test6 : Solution submitted", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[0];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, salt))
            .to.emit(contract, "SolutionSubmitted")
            .withArgs(0, code, salt);
    });
});