import Button from 'react-bootstrap/Button';
import { getCurrentGame, contract, afk_time, waitEvent, afkPressed, pressedAfk, removeAfk, isClaim,
    claimButton, removeClaim, provider, decimalToHex, getOldTimer, setNewTimer, readLastEvent,
    getCurrentAccount, afkButtonStatus,
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
    removeAfk();
    claimButton();
    window.location="/test";
    removeTimer(timeout);
}

async function send_afk(){

    try{ 
        const tx = await contract.AFK(getCurrentGame());
        const receipt = await tx.wait();
        console.debug(receipt);
        afkPressed();
        timeout = await setNewTimer(new Date(), on_timeout, afk_time+5000);

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

export default function AFKButton(){
    useEffect(() => {
        const readLogs = async() => {

            // if pressed afk, listen for opponent moves
            if (afkButtonStatus()!==null){
                const log = await readLastEvent(
                    [
                        hexZeroPad(ethers.utils.hexlify(Number(getCurrentGame())), 32)
                    ],
                    getAfkBlock()
                );
                console.log("log", log);
                if (log != undefined){
                    if (log.args["who"].toLowerCase() != getCurrentAccount())
                        removeTimer(timeout);
                        alert("Opponent moved.");
                        removeAfk();
                        window.location="/";
                }
            }

            // check if current user is under accusation
            const log = await readLastEvent([
                ethers.utils.id("AFKStart(uint256,address)"),
                ethers.utils.hexZeroPad(decimalToHex(getCurrentGame(), 32).toString(16),32)
            ], getFromBlock());
            if (log != undefined){
                if (log.args["who"].toLowerCase()===getCurrentAccount()){
                    alert("You are now under accusation! Play your move!");
                    setFromBlock(await (provider.getBlockNumber())+1);
                }
            }
        }

        // invoke immediately
        readLogs();

        // and then polling - 10sec
        const intervalId = setInterval(readLogs, 10000);

        // stop polling when the component is unmounted
        return () => clearInterval(intervalId);

    }, []);

    // retrieve an existing timer
    var oldStartTime = getOldTimer();
    if (oldStartTime){
        var startTime = new Date(oldStartTime);
        var elapsed = new Date() - startTime;
        var duration = afk_time - elapsed;
        timeout = setNewTimer(startTime, on_timeout, duration);
    }

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