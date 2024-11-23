import "@nomicfoundation/hardhat-chai-matchers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployFixture, compute_gas, expect_eq, hash, Color, delay, N_TURNS, DELAY_TIME } from "./Utils";

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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
            .to.emit(contract, "GuessSent")
            .withArgs(0, codebreaker.address);

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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
            .to.emit(contract, "GuessSent")
            .withArgs(0, codebreaker.address);

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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
            .to.emit(contract, "GuessSent")
            .withArgs(0, codebreaker.address);

        await expect(contract.connect(codemaker).sendFeedback(4, 0, 0))
            .to.emit(contract, "FeedbackSent")
            .withArgs(0, codemaker.address);
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        let code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, salt))
            .to.emit(contract, "SolutionSubmitted")
            .withArgs(0, code, salt);
    });

    it("Test7 : Bad Solution submitted - revert", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, [1,1,1,1,1]))
            .to.be.revertedWith("Invalid Solution.")
    });

    it("Test7 : Solution submitted by codebreaker - revert", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess(code, 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codebreaker).submitSolution(0, code, [1,1,1,1,1]))
            .to.be.revertedWith("Denied operation.")
    });

    it("Test8 : Solution submitted, dispute lost by codebreaker", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 0, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, salt))
            .to.emit(contract, "SolutionSubmitted")
            .withArgs(0, code, salt);

        // start dispute on the 2nd feedback
        await expect(contract.connect(codebreaker).startDispute(0, 1))
            .to.emit(contract, "Dispute")
            .withArgs(0, 1)
            .and.to.emit(contract, "Punished")
            .withArgs(0, codebreaker.address)
            .and.to.emit(contract, "Transfered")
            .withArgs(0, codemaker.address, 2);
    });

    it("Test9 : Solution submitted, dispute lost by codemaker", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, salt))
            .to.emit(contract, "SolutionSubmitted")
            .withArgs(0, code, salt);

        // start dispute on the 2nd feedback
        await expect(contract.connect(codebreaker).startDispute(0, 1))
            .to.emit(contract, "Dispute")
            .withArgs(0, 1)
            .and.to.emit(contract, "Punished")
            .withArgs(0, codemaker.address)
            .and.to.emit(contract, "Transfered")
            .withArgs(0, codebreaker.address, 2);
    });

    it("Test10 : Dispute sent too late", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, salt))
            .to.emit(contract, "SolutionSubmitted")
            .withArgs(0, code, salt);

        // start dispute on the 2nd feedback
        await delay(DELAY_TIME);

        await expect(contract.connect(codebreaker).startDispute(0, 1))
            .to.be.revertedWith("Time Over.")
    });

    it("Test11 : Dispute lost by codemaker - check balances", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        let owner_gas_cost = [];
        let addr1_gas_cost = [];
    
        let owner_balance0 = await ethers.provider.getBalance(owner);
        let addr1_balance0 = await ethers.provider.getBalance(addr1);
        let contract_balance0 = await ethers.provider.getBalance(contract);
    
        // game created by the owner of the contract
        let owner_receipt_newgame = await (await contract["newGame()"]()).wait();
        owner_gas_cost.push(owner_receipt_newgame!.gasUsed * owner_receipt_newgame!.gasPrice);
    
        let addr1_receipt_newgame = await (await contract.connect(addr1)["joinGame()"]()).wait();
        addr1_gas_cost.push(addr1_receipt_newgame!.gasUsed * addr1_receipt_newgame!.gasPrice);
    
        // declare owner
        let owner_receipt_declaregame = await (await contract.declareStake(0, 1)).wait();
        owner_gas_cost.push(owner_receipt_declaregame!.gasUsed * owner_receipt_declaregame!.gasPrice);
    
        // declare addr1
        let addr1_receipt_declaregame = await (await contract.connect(addr1).declareStake(0, 1)).wait();
        addr1_gas_cost.push(addr1_receipt_declaregame!.gasUsed * addr1_receipt_declaregame!.gasPrice);
    
        let value1 = ethers.parseUnits("1", "wei");
        
        // owner pays
        let owner_receipt_preparegame = await (await contract.prepareGame(0, { value: value1 } )).wait();
        owner_gas_cost.push(owner_receipt_preparegame!.gasUsed * owner_receipt_preparegame!.gasPrice);
    
        let contract_balance1 = await ethers.provider.getBalance(contract);
        expect_eq(contract_balance1, 1n);
    
        let owner_balance1 = await ethers.provider.getBalance(owner);
        expect_eq(owner_balance1, owner_balance0 - 1n - compute_gas(owner_gas_cost))
    
        // addr1 pays
        let addr1_receipt_preparegame = await (await contract.connect(addr1).prepareGame(0, { value: value1 } )).wait();
        addr1_gas_cost.push(addr1_receipt_preparegame!.gasUsed * addr1_receipt_preparegame!.gasPrice);
    
        let addr1_balance1 = await ethers.provider.getBalance(addr1);
        expect_eq(addr1_balance1, addr1_balance0 - 1n - (compute_gas(addr1_gas_cost)));
    
        const logs : any =  addr1_receipt_preparegame!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker, cm_gas, cb_gas] = 
            codemaker_addr === owner.address ? 
            [owner, addr1, owner_gas_cost, addr1_gas_cost] : 
            [addr1, owner, addr1_gas_cost, owner_gas_cost] ;

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        let cm_receipt_sendcode = await (await contract.connect(codemaker).sendCode(hash(code, salt), 0)).wait();
        cm_gas.push(cm_receipt_sendcode!.gasUsed * cm_receipt_sendcode!.gasPrice);

        for (let index = 0; index < 7; index++) {
        let cb_receipt_guess = await (await contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0)).wait();
        cb_gas.push(cb_receipt_guess!.gasUsed * cb_receipt_guess!.gasPrice);

        let cm_receipt_feedback = await ( await contract.connect(codemaker).sendFeedback(3, 1, 0)).wait();
        cm_gas.push(cm_receipt_feedback!.gasUsed * cm_receipt_feedback!.gasPrice);
        };

        let cb_receipt_guess = await (await contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0)).wait();
        cb_gas.push(cb_receipt_guess!.gasUsed * cb_receipt_guess!.gasPrice);
        
        // submit solution
        let cm_receipt_sol = await (await contract.connect(codemaker).submitSolution(0, code, salt)).wait();
        cm_gas.push(cm_receipt_sol!.gasUsed * cm_receipt_sol!.gasPrice);

        // start dispute on the 2nd feedback
        let cb_receipt_dispute = await (await contract.connect(codebreaker).startDispute(0, 1)).wait();
        cb_gas.push(cb_receipt_dispute!.gasUsed * cb_receipt_dispute!.gasPrice);

        let owner_balance2 = await ethers.provider.getBalance(owner);
        let addr1_balance2 = await ethers.provider.getBalance(addr1);
        let contract_balance2 = await ethers.provider.getBalance(contract);

        // codemaker == owner => owner bad behaviour
        if (codemaker_addr == owner.address) {
            expect_eq(owner_balance2, owner_balance0 - compute_gas(cm_gas) - 1n);
            expect_eq(addr1_balance2, addr1_balance0 - compute_gas(cb_gas) + 1n );
            expect_eq(contract_balance2, contract_balance0);
        } else{
            expect_eq(owner_balance2, owner_balance0 - compute_gas(cb_gas) + 1n);
            expect_eq(addr1_balance2, addr1_balance0 - compute_gas(cm_gas) - 1n );
            expect_eq(contract_balance2, contract_balance0);
        }
    });

    it("Test12 : Invalid feedback in dispute - revert", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(3, 1, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, salt))
            .to.emit(contract, "SolutionSubmitted")
            .withArgs(0, code, salt);

        await expect(contract.connect(codebreaker).startDispute(0, 9))
            .to.be.revertedWith("Feedback ID not valid.")
    });

    it("Test13 : Invalid feedback - revert", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0))
            .to.emit(contract, "GuessSent")
            .withArgs(0, codebreaker.address);

        await expect(contract.connect(codemaker).sendFeedback(3, 3, 0))
            .to.be.revertedWith("Invalid feedback.")
    });

    it("Test14 : Algorithm for solution verification test", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        const [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Yellow, Color.Red, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 7; index++) {
            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            await expect(contract.connect(codemaker).sendFeedback(1, 2, 0))
                .to.emit(contract, "FeedbackSent");
        };

        await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);
        
        // submit solution
        await expect(contract.connect(codemaker).submitSolution(0, code, salt))
            .to.emit(contract, "SolutionSubmitted")
            .withArgs(0, code, salt);

        // start dispute on the 2nd feedback
        await expect(contract.connect(codebreaker).startDispute(0, 1))
            .to.emit(contract, "Dispute")
            .withArgs(0, 1)
            .and.to.emit(contract, "Punished")
            .withArgs(0, codebreaker.address)
            .and.to.emit(contract, "Transfered")
            .withArgs(0, codemaker.address, 2);
    });

    it("Test15 : Game with N_TURNS turns - tie", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        let [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Yellow, Color.Red, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];

        for (let index = 0; index < N_TURNS; index++) {

            await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
                .to.emit(contract, "SecretCodeSent");

            for (let index = 0; index < 7; index++) {
                await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address);

                await expect(contract.connect(codemaker).sendFeedback(1, 2, 0))
                    .to.emit(contract, "FeedbackSent");
            };

            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address);

            // submit solution
            await expect(contract.connect(codemaker).submitSolution(0, code, salt))
                .to.emit(contract, "SolutionSubmitted")
                .withArgs(0, code, salt);
            
            await delay(DELAY_TIME);

            if (index == N_TURNS - 1) {
                await expect(contract.connect(codemaker).updateScore(0))
                    .to.emit(contract, "Tie")
                    .and.to.emit(contract, "Transfered")
                    .and.to.emit(contract, "Transfered");
            } else{
                await expect(contract.connect(codemaker).updateScore(0))
                .to.emit(contract, "PointsUpdated");
            }

            [codemaker, codebreaker] = [codebreaker, codemaker];
        }

    });

    it("Test16 : Game with N_TURNS turns - win", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        let [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Yellow, Color.Red, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];

        for (let index = 0; index < N_TURNS; index++) {

            // owner wins
            if (codemaker == addr1){
                await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
                .to.emit(contract, "SecretCodeSent");

                await expect(contract.connect(codebreaker).sendGuess(code, 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address);

                await expect(contract.connect(codemaker).sendFeedback(4, 0, 0))
                    .to.emit(contract, "FeedbackSent");
            }
            else {
                await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
                    .to.emit(contract, "SecretCodeSent");

                for (let index = 0; index < 7; index++) {
                    await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                        .to.emit(contract, "GuessSent")
                        .withArgs(0, codebreaker.address);

                    await expect(contract.connect(codemaker).sendFeedback(1, 2, 0))
                        .to.emit(contract, "FeedbackSent");
                };
                
                await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address);
   
            }

            // submit solution
            await expect(contract.connect(codemaker).submitSolution(0, code, salt))
                .to.emit(contract, "SolutionSubmitted")
                .withArgs(0, code, salt);
            
            await delay(DELAY_TIME);

            if (index == N_TURNS - 1) {
                await expect(contract.connect(codemaker).updateScore(0))
                    .to.emit(contract, "Winning")
                    .and.to.emit(contract, "Transfered")
                    .and.to.emit(contract, "GameClosed");
            } else{
                await expect(contract.connect(codemaker).updateScore(0))
                .to.emit(contract, "PointsUpdated");
            }

            [codemaker, codebreaker] = [codebreaker, codemaker];
        }

    });

    it("Test17 : Game with N_TURNS turns - check balances", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        let owner_gas_cost = [];
        let addr1_gas_cost = [];
    
        let owner_balance0 = await ethers.provider.getBalance(owner);
        let addr1_balance0 = await ethers.provider.getBalance(addr1);
        let contract_balance0 = await ethers.provider.getBalance(contract);
    
        // game created by the owner of the contract
        let owner_receipt_newgame = await (await contract["newGame()"]()).wait();
        owner_gas_cost.push(owner_receipt_newgame!.gasUsed * owner_receipt_newgame!.gasPrice);
    
        let addr1_receipt_newgame = await (await contract.connect(addr1)["joinGame()"]()).wait();
        addr1_gas_cost.push(addr1_receipt_newgame!.gasUsed * addr1_receipt_newgame!.gasPrice);
    
        // declare owner
        let owner_receipt_declaregame = await (await contract.declareStake(0, 1)).wait();
        owner_gas_cost.push(owner_receipt_declaregame!.gasUsed * owner_receipt_declaregame!.gasPrice);
    
        // declare addr1
        let addr1_receipt_declaregame = await (await contract.connect(addr1).declareStake(0, 1)).wait();
        addr1_gas_cost.push(addr1_receipt_declaregame!.gasUsed * addr1_receipt_declaregame!.gasPrice);
    
        let value1 = ethers.parseUnits("1", "wei");
        
        // owner pays
        let owner_receipt_preparegame = await (await contract.prepareGame(0, { value: value1 } )).wait();
        owner_gas_cost.push(owner_receipt_preparegame!.gasUsed * owner_receipt_preparegame!.gasPrice);
    
        let contract_balance1 = await ethers.provider.getBalance(contract);
        expect_eq(contract_balance1, 1n);
    
        let owner_balance1 = await ethers.provider.getBalance(owner);
        expect_eq(owner_balance1, owner_balance0 - 1n - compute_gas(owner_gas_cost))
    
        // addr1 pays
        let addr1_receipt_preparegame = await (await contract.connect(addr1).prepareGame(0, { value: value1 } )).wait();
        addr1_gas_cost.push(addr1_receipt_preparegame!.gasUsed * addr1_receipt_preparegame!.gasPrice);
    
        let addr1_balance1 = await ethers.provider.getBalance(addr1);
        expect_eq(addr1_balance1, addr1_balance0 - 1n - (compute_gas(addr1_gas_cost)));
    
        const logs : any =  addr1_receipt_preparegame!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        let [codemaker, codebreaker, cm_gas, cb_gas] = 
            codemaker_addr === owner.address ? 
            [owner, addr1, owner_gas_cost, addr1_gas_cost] : 
            [addr1, owner, addr1_gas_cost, owner_gas_cost] ;

        const code : [Color, Color, Color, Color] = [Color.Red, Color.Red, Color.Yellow, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];
        for (let index = 0; index < N_TURNS; index++) {

            // send secret code
            let cm_receipt_sendcode = await (await contract.connect(codemaker).sendCode(hash(code, salt), 0)).wait();
            cm_gas.push(cm_receipt_sendcode!.gasUsed * cm_receipt_sendcode!.gasPrice);

            for (let index = 0; index < 7; index++) {
                let cb_receipt_guess = await (await contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0)).wait();
                cb_gas.push(cb_receipt_guess!.gasUsed * cb_receipt_guess!.gasPrice);

                let cm_receipt_feedback = await ( await contract.connect(codemaker).sendFeedback(3, 1, 0)).wait();
                cm_gas.push(cm_receipt_feedback!.gasUsed * cm_receipt_feedback!.gasPrice);
            };

            let cb_receipt_guess = await (await contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Black], 0)).wait();
                cb_gas.push(cb_receipt_guess!.gasUsed * cb_receipt_guess!.gasPrice);
        
            // submit solution
            let cm_receipt_sol = await (await contract.connect(codemaker).submitSolution(0, code, salt)).wait();
            cm_gas.push(cm_receipt_sol!.gasUsed * cm_receipt_sol!.gasPrice);

            await delay(DELAY_TIME);

            // update score
            let cm_receipt_updatescore = await (await contract.connect(codemaker).updateScore(0)).wait();
            cm_gas.push(cm_receipt_updatescore!.gasUsed * cm_receipt_updatescore!.gasPrice);

            [codemaker, codebreaker, cm_gas, cb_gas] = [codebreaker, codemaker, cb_gas, cm_gas];
        }

        let owner_balance2 = await ethers.provider.getBalance(owner);
        let addr1_balance2 = await ethers.provider.getBalance(addr1);
        let contract_balance2 = await ethers.provider.getBalance(contract);

        // codemaker == owner => owner bad behaviour
        if (codemaker_addr == owner.address) { // tie!
            expect_eq(owner_balance2, owner_balance0 - compute_gas(cm_gas) - 0n);
            expect_eq(addr1_balance2, addr1_balance0 - compute_gas(cb_gas) + 0n );
            expect_eq(contract_balance2, contract_balance0);
        } else{ // tie!
            expect_eq(owner_balance2, owner_balance0 - compute_gas(cb_gas) + 0n);
            expect_eq(addr1_balance2, addr1_balance0 - compute_gas(cm_gas) - 0n );
            expect_eq(contract_balance2, contract_balance0);
        }
    });

    it("Test18 : Complete Game with AFK", async function () {
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
            .withArgs(0, owner, 1);

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        let [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        await expect(contract.connect(codebreaker).AFK(0))
            .to.emit(contract, "AFKStart");

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Yellow, Color.Red, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];

        for (let index = 0; index < N_TURNS; index++) {

            await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
                .to.emit(contract, "SecretCodeSent");

            for (let index = 0; index < 7; index++) {
                await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address);

                // codebreaker send AFK
                await expect(contract.connect(codebreaker).AFK(0))
                    .to.emit(contract, "AFKStart")

                await expect(contract.connect(codemaker).sendFeedback(1, 2, 0))
                    .to.emit(contract, "FeedbackSent")
                    .and.to.emit(contract,"AFKStop");

                // codemaker send AFK
                await expect(contract.connect(codemaker).AFK(0))
                    .to.emit(contract, "AFKStart")
            };

            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address)
                    .and.to.emit(contract,"AFKStop");

            await expect(contract.connect(codebreaker).AFK(0))
                .to.emit(contract, "AFKStart");

            // submit solution
            await expect(contract.connect(codemaker).submitSolution(0, code, salt))
                .to.emit(contract, "SolutionSubmitted")
                .withArgs(0, code, salt);
            
            await delay(DELAY_TIME);

            if (index == N_TURNS - 1) {
                await expect(contract.connect(codemaker).updateScore(0))
                    .to.emit(contract, "Tie")
                    .and.to.emit(contract, "Transfered")
                    .and.to.emit(contract, "Transfered");
            } else{
                await expect(contract.connect(codemaker).updateScore(0))
                .to.emit(contract, "PointsUpdated");
            }

            [codemaker, codebreaker] = [codebreaker, codemaker];
        }

    });

    it("Test19 : AFK in declaration and payment", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // owner send AFK
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Must do your move before to accuse to be AFK.");

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, owner, 1);

        // retry AFK
        await expect(contract.connect(owner).AFK(0))
            .to.emit(contract, "AFKStart");

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // codebreaker send AFK
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Must do your move before to accuse to be AFK.");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // retry AFK
        await expect(contract.connect(owner).AFK(0))
            .to.emit(contract, "AFKStart");

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-2].args[1];

        let [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Yellow, Color.Red, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];

        for (let index = 0; index < N_TURNS; index++) {

            await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
                .to.emit(contract, "SecretCodeSent");

            for (let index = 0; index < 7; index++) {
                await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address);

                await expect(contract.connect(codemaker).sendFeedback(1, 2, 0))
                    .to.emit(contract, "FeedbackSent");

            };

            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                    .to.emit(contract, "GuessSent")
                    .withArgs(0, codebreaker.address);

            // submit solution
            await expect(contract.connect(codemaker).submitSolution(0, code, salt))
                .to.emit(contract, "SolutionSubmitted")
                .withArgs(0, code, salt);
            
            await delay(DELAY_TIME);

            if (index == N_TURNS - 1) {
                await expect(contract.connect(codemaker).updateScore(0))
                    .to.emit(contract, "Tie")
                    .and.to.emit(contract, "Transfered")
                    .and.to.emit(contract, "Transfered");
            } else{
                await expect(contract.connect(codemaker).updateScore(0))
                .to.emit(contract, "PointsUpdated");
            }

            [codemaker, codebreaker] = [codebreaker, codemaker];
        }

    });

    it("Test20 : AFK player loses the game - declaration time", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // owner send AFK
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Must do your move before to accuse to be AFK.");

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, owner, 1);

        // retry AFK
        await expect(contract.connect(owner).AFK(0))
            .to.emit(contract, "AFKStart");

        await delay(DELAY_TIME);

        await expect(contract.connect(owner).claimStakeByAFK(0))
            .to.emit(contract, "GameClosed");

    });

    it("Test21 : AFK player loses the game - guess time", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // owner send AFK
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Must do your move before to accuse to be AFK.");

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, owner, 1);

        // retry AFK
        await expect(contract.connect(owner).AFK(0))
            .to.emit(contract, "AFKStart");

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // codebreaker send AFK
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Must do your move before to accuse to be AFK.");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // retry AFK
        await expect(contract.connect(owner).AFK(0))
            .to.emit(contract, "AFKStart");

        // addr1 send money
        let receipt = await (await (contract.connect(addr1).prepareGame(0, { value: value } ) )).wait();
        const logs : any =  receipt!.logs;
        const codemaker_addr : string = logs[logs.length-2].args[1];

        let [codemaker, codebreaker] = codemaker_addr === owner.address ? [owner, addr1] : [addr1, owner];

        // send secret code
        const code : [Color, Color, Color, Color] = [Color.Red, Color.Yellow, Color.Red, Color.Green];
        const salt : [number, number, number, number, number ] = [0, 0, 0, 0, 0];

        await expect(contract.connect(codemaker).sendCode(hash(code, salt), 0))
            .to.emit(contract, "SecretCodeSent");

        for (let index = 0; index < 3; index++) {
            // AFK on guess
            await expect(contract.connect(codemaker).AFK(0))
                .to.emit(contract, "AFKStart");

            // codebreaker reply
            await expect(contract.connect(codebreaker).sendGuess([Color.Red, Color.Red, Color.Yellow, Color.Red], 0))
                .to.emit(contract, "GuessSent")
                .withArgs(0, codebreaker.address);

            // AFK on feedback
            await expect(contract.connect(codebreaker).AFK(0))
                .to.emit(contract, "AFKStart");

            // codemaker reply
            await expect(contract.connect(codemaker).sendFeedback(1, 2, 0))
                .to.emit(contract, "FeedbackSent");

        };

        // AFK on guess
        await expect(contract.connect(codemaker).AFK(0))
        .to.emit(contract, "AFKStart");
        
        await delay(DELAY_TIME);

        await expect(contract.connect(codemaker).claimStakeByAFK(0))
            .to.emit(contract, "Winning")
            .and.to.emit(contract, "Transfered")
            .and.to.emit(contract, "GameClosed");

    });

    it("Test22 : AFK - check balances", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  
        let owner_gas_cost = [];
        let addr1_gas_cost = [];
        let cm_gas = [];
        let cb_gas = [];
        let codemaker, codebreaker;
    
        let owner_balance0 = await ethers.provider.getBalance(owner);
        let addr1_balance0 = await ethers.provider.getBalance(addr1);
        let contract_balance0 = await ethers.provider.getBalance(contract);
    
        // game created by the owner of the contract
        let owner_receipt_newgame = await (await contract["newGame()"]()).wait();
        owner_gas_cost.push(owner_receipt_newgame!.gasUsed * owner_receipt_newgame!.gasPrice);
    
        let addr1_receipt_newgame = await (await contract.connect(addr1)["joinGame()"]()).wait();
        addr1_gas_cost.push(addr1_receipt_newgame!.gasUsed * addr1_receipt_newgame!.gasPrice);
    
        // declare owner
        let owner_receipt_declaregame = await (await contract.declareStake(0, 1)).wait();
        owner_gas_cost.push(owner_receipt_declaregame!.gasUsed * owner_receipt_declaregame!.gasPrice);
    
        // declare addr1
        let addr1_receipt_declaregame = await (await contract.connect(addr1).declareStake(0, 1)).wait();
        addr1_gas_cost.push(addr1_receipt_declaregame!.gasUsed * addr1_receipt_declaregame!.gasPrice);
    
        let value1 = ethers.parseUnits("1", "wei");
        
        // owner pays
        let owner_receipt_preparegame = await (await contract.prepareGame(0, { value: value1 } )).wait();
        owner_gas_cost.push(owner_receipt_preparegame!.gasUsed * owner_receipt_preparegame!.gasPrice);
    
        let contract_balance1 = await ethers.provider.getBalance(contract);
        expect_eq(contract_balance1, 1n);
    
        let owner_balance1 = await ethers.provider.getBalance(owner);
        expect_eq(owner_balance1, owner_balance0 - 1n - compute_gas(owner_gas_cost))
    
        // addr1 pays
        let addr1_receipt_preparegame = await (await contract.connect(addr1).prepareGame(0, { value: value1 } )).wait();
        addr1_gas_cost.push(addr1_receipt_preparegame!.gasUsed * addr1_receipt_preparegame!.gasPrice);

        const logs : any =  addr1_receipt_preparegame!.logs;
        const codemaker_addr : string = logs[logs.length-1].args[1];

        [codemaker, codebreaker, cm_gas, cb_gas] = 
            codemaker_addr === owner.address ? 
            [owner, addr1, owner_gas_cost, addr1_gas_cost] : 
            [addr1, owner, addr1_gas_cost, owner_gas_cost];

        // gas for AFK
        let cb_receipt_afk = await (await contract.connect(codebreaker).AFK(0)).wait();
        cb_gas.push(cb_receipt_afk!.gasUsed * cb_receipt_afk!.gasPrice);
    
        await delay(DELAY_TIME);
    
        let cb_receipt_claim = await (await contract.connect(codebreaker).claimStakeByAFK(0)).wait();
        cb_gas.push(cb_receipt_claim!.gasUsed * cb_receipt_claim!.gasPrice);
    
        let addr1_balance1 = await ethers.provider.getBalance(addr1);
        let owner_balance2 = await ethers.provider.getBalance(owner);
        let contract_balance2 = await ethers.provider.getBalance(contract);
    
        // codemaker == owner => owner bad behaviour
        if (codemaker_addr == owner.address) {
            expect_eq(owner_balance2, owner_balance0 - compute_gas(cm_gas) - 1n);
            expect_eq(addr1_balance1, addr1_balance0 - compute_gas(cb_gas) + 1n );
            expect_eq(contract_balance2, contract_balance0);
        } else{
            expect_eq(owner_balance2, owner_balance0 - compute_gas(cb_gas) + 1n);
            expect_eq(addr1_balance1, addr1_balance0 - compute_gas(cm_gas) - 1n );
            expect_eq(contract_balance2, contract_balance0);
        }

      });

      it("Test23 : AFK in payment", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        // game joined by another user
        await expect(contract.connect(addr1)["joinGame()"]())
            .to.emit(contract, "GameJoined")
            .withArgs(addr1.address, 0);

        // owner send AFK
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Must do your move before to accuse to be AFK.");

        // declare owner
        await expect(contract.declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, owner, 1);

        // retry AFK
        await expect(contract.connect(owner).AFK(0))
            .to.emit(contract, "AFKStart");

        // declare addr1
        await expect(contract.connect(addr1).declareStake(0, 1))
            .to.emit(contract, "StakeDeclared")
            .withArgs(0, addr1, 1);

        let value = ethers.parseUnits("1", "wei");

        // codebreaker send AFK
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Must do your move before to accuse to be AFK.");

        // owner send money
        await expect(contract.prepareGame(0, { value: value } ) )
            .to.emit(contract, "StakePut")
            .withArgs(0, owner.address, 1)

        // retry AFK
        await expect(contract.connect(owner).AFK(0))
            .to.emit(contract, "AFKStart");
      
        await delay(DELAY_TIME);

        await expect(contract.connect(owner).claimStakeByAFK(0))
            .to.emit(contract, "GameClosed")
            .and.to.emit(contract, "Winning")
            .and.to.emit(contract, "Transfered");

    });

    it("Test24 : AFK in creation", async function () {
        const { contract, owner, addr1 } = await loadFixture(deployFixture);  

        // game created by the owner of the contract
        await expect(contract["newGame()"]())
            .to.emit(contract, "GameCreated")
            .withArgs(owner.address, 0);

        
        await expect(contract.connect(owner).AFK(0))
            .to.be.revertedWith("Cannot put under accusation now.");

    });

});