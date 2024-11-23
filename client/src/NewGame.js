import logo from './logo.png';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import { 
    getAccount, contract, provider, init, filter, readEvent, setPhase, readLastEvent, 
    setGame
} from './utils';

init();

// read game id on the logs
const gameListener = (event, who, id) => {
    console.debug(event, "event occurred:", who, id.toNumber());
    setGame(id.toNumber());
    setPhase(event==="GameCreated" ? "creation" : "declaration");
    window.location="/";   
};

const newGameFilter = contract.filters.GameCreated(getAccount());
const joinGameFilter = contract.filters.GameJoined(getAccount());

async function createGame(challenger){
    try{
        contract.once(newGameFilter, (w,i) => gameListener("GameCreated", w,i));

        const tx = challenger ? 
            await contract["newGame(address)"](challenger) : await contract["newGame()"]();
        const receipt = await tx.wait();
        console.debug(receipt);
        
    } catch(err){
        if (err.code === 'INVALID_ARGUMENT' || 
            err.code === 'UNSUPPORTED_OPERATION')        alert("Invalid Address.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);

        contract.off(newGameFilter);
    }
}

async function joinGame(game_id){
    try{
        contract.once(joinGameFilter, (w,i) => gameListener("GameJoined", w,i));

        const tx = game_id ?
            await contract["joinGame(uint256)"](game_id) : await contract["joinGame()"]();
        const receipt = await tx.wait();
        console.debug(receipt);

    } catch(err){
        if (err.code === 'INVALID_ARGUMENT')        alert("Invalid Game ID.");
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err.message);

        contract.off(joinGameFilter);
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