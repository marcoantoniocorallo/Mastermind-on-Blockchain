import Button from 'react-bootstrap/Button';
import { getGame, contract, afk_time, waitEvent, afkPressed, pressedAfk, removeAfk, isClaim,
    claimButton,getAccount, afkButtonStatus, init, clearGame
} from './utils';
import { useEffect } from 'react';

let timeout;
let winningAlert = false;

function on_timeout(){
    console.debug("AFK Time-out reached");
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

const winningFilter = contract.filters.Winning(getGame());

const winningListener = (id, who) => {
    console.debug("Winning event occurred:", who, id.toNumber());
    if (who.toLowerCase() === getAccount()) alert("You won this game.");
    else                                    alert("You lost this game.");
    winningAlert = true;       
};

const closeGameFilter = contract.filters.GameClosed(getGame());

const closeGameListener = () => {
    if (winningAlert){
        console.debug("GameClosed event occurred:", getGame());
        clearGame();
        window.location="/";
    } else{
        console.debug("winning alert not arrived yet.");
        setTimeout(closeGameListener, 2000);
    }
};

async function send_afk(){
    try{
        contract.once(contract.filters.AFKStop(Number(getGame())), on_opponentMove);

        afkPressed(); // disable AFK button and store button label on localstorage

        const tx = await contract.AFK(getGame());
        const receipt = await tx.wait();
        console.debug(receipt);
        
        timeout = setTimeout(on_timeout, afk_time+5000);

    } catch(err){
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);

        removeAfk();
        clearTimeout(timeout);
        contract.off(contract.filters.AFKStop(Number(getGame())), on_opponentMove);
    }
}

async function send_claim(){
    try {
        contract.once(winningFilter, winningListener);
        contract.once(closeGameFilter, closeGameListener);

        document.getElementById("afkbutton").disabled=true;

        const tx =  await contract.claimStakeByAFK(getGame());
        const receipt = await tx.wait();
        console.debug(receipt);

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT')        alert("Invalid Game ID.");
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err.message);
        contract.off(winningFilter, winningListener);
        contract.off(closeGameFilter, closeGameListener);
        document.getElementById("afkbutton").disabled=false;
    }
}

init();

const afkFilter = contract.filters.AFKStart(getGame());

const afkHandler = (id, who) => {
    console.debug("AFKStart event occurred:", id, who);

    if(who.toLowerCase() === getAccount())
        alert("You are under accusation! Play your move!");

    contract.once(winningFilter, winningListener);
    contract.once(closeGameFilter, closeGameListener);
    contract.once(contract.filters.AFKStop(Number(getGame())), 
        () => {
            contract.off(closeGameFilter, closeGameListener)
            contract.off(closeGameFilter, closeGameListener);
        }
    );
}

export default function AFKButton(){

    useEffect(() => {
        contract.on(afkFilter, afkHandler);
    
        return () => contract.off(afkFilter, afkHandler);

    }, []);

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