import CloseButton from 'react-bootstrap/CloseButton';
import { leaveGame, getCurrentGame } from './utils';

export function Closebutton(){
    const game_id = getCurrentGame();

    return (
        <CloseButton 
            aria-label='Leave Game' 
            onClick={() => leaveGame(game_id)}
            style={{ width:50, height:50, position: 'absolute', right:400 }} 
            variant='white'>
            <p style={{position:'absolute', fontSize:13, top:0, right:15}}>Leave</p>
        </CloseButton>
    );
}