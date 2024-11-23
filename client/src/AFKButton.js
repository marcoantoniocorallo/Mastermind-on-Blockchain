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
    alert("You can now get your prize!");
    removeAfk(); // enable button
    claimButton(); // change behaviour to the button
    window.location="/";
}

const on_opponentMove = () => {
    console.debug("StopAFK event occurred");

    clearTimeout(timeout);
    alert("Opponent moved.");
    removeAfk();
}

async function send_afk(){
    
    try{
        contract.once(contract.filters.AFKStop(getGame()), on_opponentMove);

        const tx = await contract.AFK(getGame());
        const receipt = await tx.wait();
        console.debug(receipt);
        afkPressed(); // disable AFK button and store button label on localstorage
        timeout = setTimeout(on_timeout, afk_time+5000);

    } catch(err){
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);

        removeAfk();
        clearTimeout(timeout);
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

    if(who.toLowerCase() === getAccount())
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