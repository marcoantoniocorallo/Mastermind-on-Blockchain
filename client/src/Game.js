import SecretCode from "./SecretCode";
import Closebutton from "./Closebutton";
import AFKButton from './AFKButton';
import logo from './logo.png';
import { contract, getGame, getPhase, getRole, setPhase } from "./utils";
import Solution from "./Solution";
import Stack from 'react-bootstrap/Stack';

const secretCodeFilter = contract.filters.SecretCodeSent(getGame());

export default function Game(){
    if(getPhase() === "secretcode" && getRole() === "CodeBreaker") 
        contract.once(secretCodeFilter, () => {
            console.debug("SecretCodeSent event occurred");
            setPhase("game"); 
            window.location="/";
        });

    return(
        <>
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>
            <h2>You are the {getRole()}</h2>
            {
                getPhase() === "secretcode" ? (
                    getRole() === "CodeMaker" ? 
                    <SecretCode/> : <h2 className="loading">CodeMaker is choosing the secret code</h2>
                ) :   ""
            }
            <Closebutton/>
            <AFKButton/>
        </div>
        { /* <Solution/> */ }
        </>
    );
}