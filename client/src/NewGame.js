import logo from './logo.png';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import { 
    getCurrentAccount, contract, provider, init, filter, readEvent, setCurrentPhase, readLastEvent 
} from './utils';
import {ABI, CONTRACT_ADDRESS} from "./ABI";
import { BigNumber, ethers, EtherscanProvider, signer } from "ethers";
import { hexZeroPad } from '@ethersproject/bytes';


async function createGame(challenger){
    init();

    try{
        const tx = challenger ? 
            await contract["newGame(address)"](challenger) : await contract["newGame()"]();
        const receipt = await tx.wait();
        console.debug(receipt);
        setCurrentPhase("creation");
        
        // read game id on the logs
        const log = await readLastEvent([
            ethers.utils.id("GameCreated(address,uint256)"),
            hexZeroPad(getCurrentAccount(), 32),
            null
        ])
        const game_id = log.args["id"].toNumber();
        console.debug("Game ID:",log.args["id"],game_id);
        window.localStorage.setItem(getCurrentAccount()+"_game",game_id);
        window.location="/";

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT' || err.code === 'UNSUPPORTED_OPERATION') 
            alert("Invalid Address.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
}

async function joinGame(game_id){
    init();

    try{
        const tx = game_id ?
            await contract["joinGame(uint256)"](game_id) : await contract["joinGame()"]();
        const receipt = await tx.wait();
        console.debug(receipt);
        setCurrentPhase("creation");
        
        // read game id on the logs
        const log = await readLastEvent([
            ethers.utils.id("GameJoined(address,uint256)"),
            hexZeroPad(getCurrentAccount(), 32),
            null
        ])
        game_id = log.args["id"].toNumber();
        console.debug("Game ID:",log.args["id"],game_id);
        window.localStorage.setItem(getCurrentAccount()+"_game",game_id);
        window.location="/";

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT') 
            alert("Invalid Game ID.");
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err.message);
    }
}

export default function NewGame(){ 
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>        
            
            <ButtonGroup aria-label="Choose game" size='lg'>
                <Button variant="secondary" style={{cursor: 'default'}}>
                    <label 
                        style={{padding:10, cursor: 'pointer' }} 
                        onClick={() => createGame(document.getElementById('challenger_addr').value)
                    }>
                        New Game
                    </label>
                    <Form.Control required
                        style={{width: 120, height: 10 }} 
                        id="challenger_addr" size="sm" placeholder="Challenger"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                createGame(e.target.value);
                            }
                        }}
                    />
                </Button>
                
                <Button variant="secondary" style={{cursor: 'default'}} >
                    <label style={{padding:10, cursor: 'pointer' }} 
                        onClick={() => joinGame(document.getElementById('game_id').value)}>
                        Join a Game
                    </label>
                    <Form.Control required
                        style={{ marginLeft:30, marginRight:20, width: 70, height: 10 }} 
                        id="game_id" size="sm" placeholder="ID" type='number'
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                joinGame(e.target.value);
                            }
                        }}
                    />
                </Button>
                
            </ButtonGroup>
        </div>
    );
};