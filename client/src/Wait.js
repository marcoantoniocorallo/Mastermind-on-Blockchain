import logo from './logo.png';
import { Closebutton } from './Closebutton';
import { ethers } from "ethers";
import { 
    getCurrentAccount, getCurrentGame, contract, init, readEvent, provider, setCurrentPhase, 
    leaveGame, waitEvent, listenLeft
} from './utils';
import { ABI, CONTRACT_ADDRESS } from './ABI';
import { hexZeroPad } from '@ethersproject/bytes';
import { useEffect } from 'react';
import AFKButton from './AFKButton';

export default function Wait(){
    const game_id = getCurrentGame();

    useEffect(() => {
        const readLogs = async() => {

            // read for join events
            await waitEvent(
                [
                    ethers.utils.id("GameJoined(address,uint256)"),
                    null,
                    hexZeroPad(ethers.utils.hexlify(Number(game_id)), 32)
                ],
                () => {setCurrentPhase("declaration"); window.location="/";}
            )

            // read for leftgame events
            await listenLeft();
        };

        // invoke immediately
        readLogs();

        // and then polling - 10sec
        const intervalId = setInterval(readLogs, 10000);

        // stop polling when the component is unmounted
        return () => clearInterval(intervalId);

    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>  
            {<Closebutton/>}
            <h2 className="loading">
                Waiting for the challenger
            </h2>
            <h2>Game ID: {game_id}</h2>
        </div>
    )
}