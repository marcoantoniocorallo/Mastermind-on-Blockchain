import CloseButton from 'react-bootstrap/CloseButton';
import { leaveGame, getCurrentGame, listenLeft } from './utils';
import { useEffect } from 'react';

let intervalId;

export function Closebutton(){
    const game_id = getCurrentGame();

    useEffect(() =>{
        const readLogs = async() => {
            // read for leftgame events
            await listenLeft(intervalId);

        }
        
        // invoke immediately
        readLogs();

        // and then polling - 10sec
        intervalId = setInterval(readLogs, 10000);

        // stop polling when the component is unmounted
        return () => clearInterval(intervalId);
    }, []);

    return (
        <CloseButton 
            aria-label='Leave Game' 
            onClick={() => leaveGame(game_id)}
            style={{ width:50, height:50, position: 'absolute', left: '90%', top: '10%' }} 
            variant='white'>
            <p style={{position:'absolute', fontSize:13, top:0, right:15}}>Leave</p>
        </CloseButton>
    );
}