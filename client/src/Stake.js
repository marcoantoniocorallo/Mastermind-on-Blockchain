import logo from './logo.png';
import { FaRegPaperPlane } from "react-icons/fa";
import { 
    getAccount, getGame, contract, setPhase,  getPhase, setRole, getStake, setStake, clearGame,
    setFirstStake, setSentStake, getSentStake,  getFirstStake,
} from './utils';
import { ethers } from "ethers";
import Chat from "./Chat";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Closebutton from './Closebutton';
import AFKButton from './AFKButton';
import { useState } from 'react';

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
        document.getElementById("stake").disabled=true;
        document.getElementById("dec_button").disabled=true;

        const receipt = await tx.wait();
        console.debug(receipt);

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT' || err.code === 'UNSUPPORTED_OPERATION') 
            alert("Invalid Stake.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);

        document.getElementById("stake").disabled=false;
        document.getElementById("dec_button").disabled=false;
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
        document.getElementById("sendstake").disabled=true;
        setSentStake();

        const receipt = await tx.wait();
        console.debug(receipt);      

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT' || err.code === 'UNSUPPORTED_OPERATION') 
            alert("Invalid Stake.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);

        document.getElementById("sendstake").disabled=false;
    }
}

const declarationFilter = contract.filters.StakeDeclared(getGame());
const shuffledFilter = contract.filters.Shuffled(getGame());

const ShuffledHandler = (id, cm, cb) => {
    console.debug("Shuffled event occurred:", id, cm, cb);

    setRole(cm.toLowerCase() === getAccount() ? "CodeMaker" : "CodeBreaker");
    setPhase("secretcode");
    window.location="/";
};

export default function Stake(){
    const [send_button, setSend_button] = useState(getPhase() === "preparation");

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
                setSend_button(true);
            }
        } else setFirstStake(stake);
    
    };    

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
                            disabled={getStake() ? true : false}/>
                        <Button variant="secondary" id="dec_button"
                            onClick={() => declareStake(document.getElementById('stake').value)} 
                            disabled={getStake() ? true : false}>
                            Declare
                        </Button>
                    </InputGroup>
                </Form.Group>
            </Form>
            <AFKButton/>
            <Chat/>
            {
                send_button || getPhase()==="preparation" ? 
                <Button variant="secondary" style={{margin:10, position:'relative'}} id='sendstake' 
                    onClick={()=>sendStake(getStake())}
                    disabled={(getSentStake() ? true : false)}>
                    Send stake &nbsp;
                    <FaRegPaperPlane/>
                </Button>: ""
            }
        </div>
    )
}