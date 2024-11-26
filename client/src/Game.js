import SecretCode from "./SecretCode";
import Closebutton from "./Closebutton";
import AFKButton from './AFKButton';
import logo from './logo.png';
import { contract, getGame, getPhase, getRole, setPhase, setTurn } from "./utils";
import Solution from "./Solution";
import GuessesWindow from "./GuessesWindow";
import Feedback from "./Feedback";
import Guess from "./Guess";
import FeedbacksWindow from "./FeedbacksWindow";

const secretCodeFilter = contract.filters.SecretCodeSent(getGame());

export default function Game(){
    if(getPhase() === "secretcode" && getRole() === "CodeBreaker") 
        contract.once(secretCodeFilter, () => {
            console.debug("SecretCodeSent event occurred");
            setPhase("guess"); 
            setTurn(0);
            window.location="/";
        });

    return(
        <>
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>
            <h2 style={{position:"absolute", top:"20%", left:"5%"}}>You are the {getRole()}</h2>
            {
                getPhase() === "secretcode" ? (
                    getRole() === "CodeMaker" ? 
                    <SecretCode/> : 
                    <h2 className="loading" style={{position:"absolute", top:"30%", left:"5%"}} >CodeMaker is choosing the secret code</h2>
                ) :  
                getPhase() === "guess" ? (
                    getRole() === "CodeBreaker" ? 
                    <Guess/> : <h2 className="loading" style={{position:"absolute", top:"30%", left:"5%"}}>CodeBreaker is guessing</h2>
                ) :
                getPhase() === "feedback" ? (
                    getRole() === "CodeMaker" ? 
                    <Feedback/> : <h2 className="loading" style={{position:"absolute", top:"30%", left:"5%"}}>CodeMaker is sending a feedback</h2>
                ) : ""
            }
            <GuessesWindow/>
            <FeedbacksWindow/>
            <Closebutton/>
            <AFKButton/>
        </div>
        { /* <Solution/> */ }
        </>
    );
}