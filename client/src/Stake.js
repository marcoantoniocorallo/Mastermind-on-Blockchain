import logo from './logo.png';
import { ABI } from './ABI';
import CloseButton from 'react-bootstrap/CloseButton';
import { FaRegPaperPlane } from "react-icons/fa";
import { 
    getAccount, getGame, contract, init, readEvent, provider, setPhase, 
    leaveGame, waitEvent, clearChat, wait2Declarations, getPhase,
    decimalToHex,
    wait2Events,
    readLastEvent,
    setRole,
    listenLeft,
    clearStake,
    getStake,
    setStake,
    clearGame,
    getFirstStake,
    setFirstStake, setSentStake, removeSentStake,
    getSentStake,
    removeFirstStake
} from './utils';
import { ethers } from "ethers";
import { useEffect } from 'react';
import Chat from "./Chat";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { Closebutton } from './Closebutton';
import AFKButton from './AFKButton';

async function declareStake(stake){
    if (stake===undefined || stake===null || stake===NaN || stake===""){
        alert("Invalid Stake.");
        return;
    }

    setStake(stake);
    try{
        const tx = await contract.declareStake(
            getGame(), 
            ethers.utils.parseUnits(stake, "gwei")
        );
        const form1 = document.getElementById("stake");
        const form2 = document.getElementById("dec_button");
        form1.disabled=true;
        form2.disabled=true;

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
            getGame(),
            {value: ethers.utils.parseUnits(stake, "gwei")}
        );
        const form = document.getElementById("sendstake");
        form.disabled=true;
        setSentStake();

        const receipt = await tx.wait();
        console.debug(receipt);      

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT' || err.code === 'UNSUPPORTED_OPERATION') 
            alert("Invalid Stake.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
}

const declarationFilter = contract.filters.StakeDeclared(getGame());
const shuffledFilter = contract.filters.Shuffled(getGame());

const declarationHandler = (id, who, stake) => {
    console.debug("StakeDeclared event occurred:", id, who, stake);

    if(getFirstStake()){
        if (stake != getFirstStake()){
            alert("A player declared a non-lecit stake.");
            contract.off(declarationFilter);
            clearGame();
        } else{
            contract.off(declarationFilter);
            setPhase("preparation");
            window.location="/";
        }
    } else setFirstStake(stake);

};

const ShuffledHandler = (id, cm, cb) => {
    console.debug("Shuffled event occurred:", id, cm, cb);

    setRole(cm.toLowerCase() === getAccount() ? "codemaker" : "codebreaker");
    removeSentStake();
    //setPhase("secretcode");
    //window.location="/";
};

export default function Stake(){
    
    if(getPhase()==="declaration") 
        contract.on(declarationFilter, declarationHandler);

    if(getPhase()==="preparation")
        contract.once(shuffledFilter, ShuffledHandler);


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
                        <Form.Control type='number' id="stake" 
                            placeholder={getPhase()==="declaration" ? 'Stake in gwei' : getStake()}
                            disabled={(getPhase() === "preparation" ? true : false)}/>
                        <Button variant="primary" id="dec_button"
                            onClick={() => declareStake(document.getElementById('stake').value)} 
                            disabled={(getPhase() === "preparation" ? true : false)}>
                            Declare
                        </Button>
                    </InputGroup>
                </Form.Group>
            </Form>
            <AFKButton/>
            <Chat/>
            {
                getPhase()==="preparation" ? 
                <Button style={{margin:10, position:'relative'}} id='sendstake' 
                    onClick={()=>sendStake(getStake())}
                    disabled={(getSentStake() ? true : false)}>
                    Send stake &nbsp;
                    <FaRegPaperPlane/>
                </Button>: ""
            }
        </div>
    )
}