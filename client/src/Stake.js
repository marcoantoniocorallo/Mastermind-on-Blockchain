import logo from './logo.png';
import CloseButton from 'react-bootstrap/CloseButton';
import { FaRegPaperPlane } from "react-icons/fa";
import { 
    getCurrentAccount, getCurrentGame, contract, init, readEvent, provider, setCurrentPhase, 
    leaveGame, waitEvent, clearChat, wait2Declarations, getCurrentPhase,
    decimalToHex,
    wait2Events,
    readLastEvent,
    setRoles
} from './utils';
import { ethers } from "ethers";
import { hexlify, hexZeroPad } from '@ethersproject/bytes';
import { useEffect } from 'react';
import Chat from "./Chat";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Closebutton } from './Closebutton';

async function declareStake(stake){
    if (stake===undefined || stake===null || stake===NaN || stake===""){
        alert("Invalid Stake.");
        return;
    }

    window.localStorage.setItem("stake",stake);
    try{
        const tx = await contract.declareStake(
            getCurrentGame(), 
            ethers.utils.parseUnits(stake, "gwei")
        );
        const form = document.getElementById("stake");
        form.disabled=true;

        const receipt = await tx.wait();
        console.debug(receipt);

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT' || err.code === 'UNSUPPORTED_OPERATION') 
            alert("Invalid Stake.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
}

async function sendStake(stake){
    if (stake===undefined || stake===null || stake===NaN || stake===""){
        alert("Invalid Stake.");
        return;
    }

    try{
        const tx = await contract.prepareGame(
            getCurrentGame(),
            {value: ethers.utils.parseUnits(stake, "gwei")}
        );
        const form = document.getElementById("sendstake");
        form.disabled=true;

        const receipt = await tx.wait();
        console.debug(receipt);      

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT' || err.code === 'UNSUPPORTED_OPERATION') 
            alert("Invalid Stake.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
}

export default function Stake(){
    const game_id = getCurrentGame();

    useEffect(() =>{
        const readLogs = async() => {

            // read for leftgame events
            await waitEvent(
                [
                    ethers.utils.id("GameLeft(uint256,address)"),
                    hexZeroPad(ethers.utils.hexlify(Number(game_id)), 32),
                ],
                () => {setCurrentPhase(""); window.location="/";}
            );

            if(getCurrentPhase()==="declaration"){

                // wait for the other player's declaration
                const logs = await wait2Events(
                    [
                        ethers.utils.id("StakeDeclared(uint256,address,uint256)"),
                        ethers.utils.hexZeroPad(decimalToHex(getCurrentGame(), 32).toString(16),32)
                    ],
                    () => {
                        setCurrentPhase("preparation");
                        window.location="/";
                    }
                );
            }

            if(getCurrentPhase()==="preparation"){

                // wait for the other player's declaration
                const log = await readLastEvent(
                    [
                        ethers.utils.id("Shuffled(uint256,address,address)"),
                        ethers.utils.hexZeroPad(decimalToHex(getCurrentGame(), 32).toString(16),32)
                    ]
                );
                console.debug("logs: ",log.args);
                const codemaker = log.args["_codemaker"];
                const codebreaker = log.args["_codebreaker"];
                setRoles(codemaker, codebreaker);

                setCurrentPhase("secretcode");
                window.location="/";
            }
        };

        // invoke immediately
        readLogs();

        // and then polling - 5sec
        const intervalId = setInterval(readLogs, 30000);

        // stop polling when the component is unmounted
        return () => clearInterval(intervalId);

    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>  
            <Closebutton/>
            <Form>
                <Form.Group>
                    <Form.Label>Definitive Stake</Form.Label>
                    <InputGroup style={{zIndex:"0"}}>
                        <Form.Control type='number' id="stake" placeholder='Stake in gwei' 
                            disabled={(getCurrentPhase()==="preparation"?true:false)}/>
                        <Button variant="primary" onClick={() => declareStake(document.getElementById('stake').value)}>
                            Declare
                        </Button>
                    </InputGroup>
                </Form.Group>
            </Form>
            <Chat/>
            {
                getCurrentPhase()==="preparation" ? 
                <Button style={{margin:10}} id='sendstake' onClick={()=>sendStake(window.localStorage.getItem("stake"))}>
                    Send stake &nbsp;
                    <FaRegPaperPlane/>
                </Button>: ""
            }
        </div>
    )
}