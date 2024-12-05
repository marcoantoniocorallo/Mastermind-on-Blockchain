import logo from './logo.png';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import { getAccount, contract, init, setPhase, setGame, setMyGames, getMyGames } from './utils';
import { useEffect, useState } from 'react';

init();

export default function NewGame(){
    const [games, setGames] = useState([]);

    // read game id on the logs
    const gameListener = (event, who, id) => {
        console.debug(event, "event occurred:", who, id.toNumber());
        setGame(id.toNumber());
        setPhase(event==="GameCreated" ? "creation" : "declaration");

        if (event === "GameJoined"){
            setGames((prevGames) => prevGames.filter((item) => item.id.toString() !== id.toString() ));
        }

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

    const myGamesFilter = contract.filters.GameCreated(null, null, getAccount());
    useEffect(() => {
        contract.on(myGamesFilter, (creator, id, me) => {
            console.debug("GameCreated event occurred with this address as challenger:", id, creator);

            const newG = {
                creator: creator,
                id: id.toString(),
            };

            setGames((prevGames) => [...prevGames, newG]);
        });

        // Cleanup listener on unmount
        return () => {
            contract.off(myGamesFilter);
        };
    }, []);

    const myGamesClosedFilter = contract.filters.GameLeft(null);
    useEffect(() => {
        contract.on(myGamesClosedFilter, (id, who) => {
            console.debug("GameLeft event occurred:", id, who);

            // Use functional update to ensure latest state
            setGames((prevGames) => prevGames.filter((item) => item.id.toString() !== id.toString() ));
        });

        // Cleanup listener on unmount
        return () => {
            contract.off(myGamesClosedFilter);
        };
    }, []);

    // Load data from localStorage when the component mounts
    useEffect(() => {
        const savedGames = getMyGames();
        if (savedGames)
            setGames(JSON.parse(savedGames));
    }, []);

    // Save the games to localStorage whenever it changes
    useEffect(() => {
        setMyGames(JSON.stringify(games));
    }, [games]);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>        
            
            <h2 style={{position:"absolute", right: "5%", top: "10%",}}>Your games:
            {games.length === 0 ? (
                    ""
                ) : (
                    games.map((game) => (
                        <div key={game.id.toString()}>
                            <div style={{ display: "flow", fontSize: 15, padding:"2%"}}>
                                <p>{game.creator}, Game {game.id.toString()}</p>
                            </div>
                        </div>
                    ))
            )}
            </h2>

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