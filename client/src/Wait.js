import logo from './logo.png';
import Closebutton from './Closebutton';
import { getGame, contract, init, setPhase, } from './utils';

const joinGameFilter = contract.filters.GameJoined(null, getGame());

export default function Wait(){
    init();
    contract.once(joinGameFilter, (who, id) => {
        console.debug("GameJoined event occurred:", who, id.toNumber());
        setPhase("declaration"); 
        window.location="/";
    });

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>  
            {<Closebutton/>}
            <h2 className="loading">
                Waiting for the challenger
            </h2>
            <h2>Game ID: {getGame()}</h2>
        </div>
    )
}