import logo from './logo.png';
import CloseButton from 'react-bootstrap/CloseButton';
import { ethers } from "ethers";
import { getCurrentAccount, getCurrentGame, contract, init, readEvent, provider, setCurrentPhase, leaveGame } from './utils';
import { ABI, CONTRACT_ADDRESS } from './ABI';
import { hexZeroPad } from '@ethersproject/bytes';
import { useEffect } from 'react';

export default function Wait(){
    const game_id = getCurrentGame();

    useEffect(() =>{
        const readLogs = async() => {

            // read for join events
            const joinLogs = await provider.getLogs({
                address: CONTRACT_ADDRESS,
                topics: [
                    ethers.utils.id("GameJoined(address,uint256)"),
                    null,
                    hexZeroPad(ethers.utils.hexlify(Number(game_id)), 32)
                ],
                fromBlock: provider.getBlockNumber() - 10000, 
            });
            if( joinLogs.length > 0){
                console.debug(joinLogs);
                joinLogs.forEach(element => {
                    console.debug(element.topics);
                });
                setCurrentPhase("declaration");
                window.location="/";
            }
            // read for leftgame events
            const leftLogs = await provider.getLogs({
                address: CONTRACT_ADDRESS,
                topics: [
                    ethers.utils.id("GameLeft(uint256,address)"),
                    hexZeroPad(ethers.utils.hexlify(Number(game_id)), 32),
                ],
                fromBlock: provider.getBlockNumber() - 10000, 
            });
            if( leftLogs.length > 0){
                console.log("Found!");
                console.debug(leftLogs);
                leftLogs.forEach(element => {
                    console.debug(element.topics);
                });
                setCurrentPhase("");
                window.location="/";
            }
        };

        // polling 5sec
        const intervalId = setInterval(readLogs, 5000);

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
                onClick={() => leaveGame(game_id)}
                style={{ width:50, height:50, position: 'absolute', right: '350px' }} 
                variant='white'/>
            <h2 className="loading">
                Waiting for the challenger
            </h2>
            <h2>Game ID: {game_id}</h2>
        </div>
    )
}