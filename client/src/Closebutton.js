import CloseButton from 'react-bootstrap/CloseButton';
import {getGame, listenLeft, contract, getAccount, setPhase, clearGame
} from './utils';
import { useEffect } from 'react';

const leftGameFilter = contract.filters.GameLeft(getGame());

async function leaveGame(game_id){  
    try{
        const tx = await contract.leaveGame(game_id);
        const receipt = await tx.wait();
        console.debug(receipt);
    } catch(err){
        if (err.code === 'INVALID_ARGUMENT') 
            alert("Invalid Game ID.");
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err.message);
    }
}

export default function Closebutton(){

    useEffect(() =>{
        contract.once(
            leftGameFilter,
            (id, who) => { 
                console.debug("LeftGame event occurred:",id,who);
                if( who.toLowerCase() != getAccount()) alert("A player left the game.");
                clearGame();
            }
        );

        return () => contract.off(leftGameFilter);
    }, []);

    return (
        <CloseButton 
            aria-label='Leave Game' 
            onClick={() => leaveGame(getGame())}
            style={{ width:50, height:50, position: 'absolute', left: '92%', top: '5%' }} 
            variant='white'>
            <p style={{position:'absolute', fontSize:13, top:0, right:15}}>Leave</p>
        </CloseButton>
    );
}