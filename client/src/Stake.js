import logo from './logo.png';
import CloseButton from 'react-bootstrap/CloseButton';
import { getCurrentAccount, getCurrentGame, contract, init, readEvent, provider, setCurrentPhase, leaveGame } from './utils';
import { ethers } from "ethers";
import { ABI, CONTRACT_ADDRESS } from './ABI';
import { hexZeroPad } from '@ethersproject/bytes';
import { useEffect } from 'react';
import Chat from "./Chat";

export default function Stake(){
    const game_id = getCurrentGame();

    useEffect(() =>{
        const readLogs = async() => {

            // read for leftgame events
            const leftLogs = await provider.getLogs({
                address: CONTRACT_ADDRESS,
                topics: [
                    ethers.utils.id("GameLeft(uint256,address)"),
                    hexZeroPad(ethers.utils.hexlify(Number(game_id)), 32)
                ],
                fromBlock: provider.getBlockNumber() - 10000, 
            });
            if( leftLogs.length > 0){
                console.debug(leftLogs);
                leftLogs.forEach(element => {
                    console.debug(element.topics);
                });
                setCurrentPhase("");
                window.location="/";
            }
        };

        // polling 5sec
        const intervalId = setInterval(readLogs, 30000);

        // stop polling when the component is unmounted
        return () => clearInterval(intervalId);

    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>  
            <CloseButton 
                aria-label='Leave Game' 
                onClick={() => leaveGame(getCurrentGame())}
                style={{ width:50, height:50, position: 'absolute', right: '350px' }} 
                variant='white'/>
            <h2 className="loading">
                Playing the game {getCurrentGame()}
            </h2>
            <Chat/>
        </div>
    )
}