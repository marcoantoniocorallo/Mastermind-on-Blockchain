import Button from 'react-bootstrap/Button';
import { getGame, contract, afk_time, waitEvent, afkPressed, pressedAfk, removeAfk, isClaim,
    claimButton, removeClaim, provider, decimalToHex, getOldTimer, setNewTimer, readLastEvent,
    getAccount, afkButtonStatus, init,
    removeTimer,
    getAfkBlock,
    setFromBlock,
    getFromBlock
} from './utils';
import { hexZeroPad } from '@ethersproject/bytes';
import { ethers } from "ethers";
import { useEffect } from 'react';

let timeout;

function on_timeout(){
    contract.off("*", on_opponentMove);
    alert("You can now get your prize!");
    removeAfk();
    claimButton();
    window.location="/";
}

const on_opponentMove = (event, ...args) => {
    if(event.args["id"] === getGame()){
        console.debug('AFK Listener - event emitted:', event);
        alert("Opponent moved.");
        removeAfk();
        clearTimeout(timeout);
    }
}

async function send_afk(){
    
    try{
        const tx = await contract.AFK(getGame());
        const receipt = await tx.wait();
        console.debug(receipt);
        afkPressed();
        timeout = setTimeout(on_timeout, afk_time+3000);

        contract.once("*", on_opponentMove);

    } catch(err){
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
    }

async function send_claim(){
    alert("claim");
    removeAfk()
    window.location="/";
}

init();

const afkFilter = contract.filters.AFKStart(getGame());
const afkHandler = (id, who) => {
    console.debug("AFKStart event occurred:", id, who);

    if(who === getAccount())
        alert("You are under accusation! Play your move!");
}

export default function AFKButton(){

    contract.on(afkFilter, afkHandler);
    
    return(
        <Button id="afkbutton"
            aria-label="AFK"
            disabled={afkButtonStatus()==="AFK"? true : false}
            onClick={() => afkButtonStatus()==="Claim" ? send_claim() : send_afk()}
            style={{ position: 'absolute', left: '5%', top: '85%' }} 
            variant="light"
        >
            {afkButtonStatus() ? afkButtonStatus() : "AFK"}
        </Button>
    )
}