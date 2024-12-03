import logo from "./logo.png";
import Button from "react-bootstrap/esm/Button";
import Closebutton from "./Closebutton";
import { contract, getGame, setPoints, setPhase, setRole, getRole, getAccount, newRound, 
    getRound, clearGame, getPoints 
} from "./utils";
import { useEffect, useState } from "react";
import Chat from "./Chat";

const scoreFilter = contract.filters.PointsUpdated(getGame());
const winningFilter = contract.filters.Winning(getGame());
const tieFilter = contract.filters.Tie(getGame());

export default function UpdateScore(){
    const [buttonPressed, setButtonPressed] = useState(false);
    const [score, setScore] = useState(getPoints());

    let scoreArrived = false;

    const winningHandler = (id, who) => {
        console.debug("Winning event occurred:", who, id.toNumber());
        if (scoreArrived){
            if (who.toLowerCase() === getAccount()) alert("You won this game.");
            else                                    alert("You lost this game.");
            setTimeout(clearGame(), 1000);
        } else setTimeout(winningHandler, 2000);
    };

    const tieHandler = () => {
        if (scoreArrived){
            console.debug("Tie event occurred:");
            alert("Wow! There is a draw!");
            setTimeout(clearGame(), 1000);
        } else setTimeout(tieHandler, 2000);
    };

    useEffect(() => {
        if ( getRound() == 3){
            contract.once(winningFilter, winningHandler);
            contract.once(tieFilter, tieHandler);
        }

        contract.once(scoreFilter, (id, score) => {
            console.debug("PointsUpdated event occurred:",id,score);
            scoreArrived = true;

            if (getRole()==="CodeMaker") {
                setPoints(score);
                setScore(score);
            }
            if (getRound() < 3){
                setPhase("secretcode");
                setRole(getRole() === "CodeMaker" ? "CodeBreaker" : "CodeMaker");
                newRound();
                window.location="/";
            }
        });

        return () => { 
            contract.off(scoreFilter); 
            contract.off(winningFilter);
            contract.off(tieFilter);
        }

    }, []);

    async function updateScore(){
        try{
            setButtonPressed(true);
            const tx = await contract.updateScore(getGame());
            const receipt = await tx.wait();
            console.debug(receipt);
    
        } catch(err){
            if (err.code === 'UNPREDICTABLE_GAS_LIMIT'){
                if (err.error.message.substring(20) == "Operation not allowed now.")
                    console.debug("Phase doesn't match, already requested by the other player probably.");
                else{
                    alert(err.error.message.substring(20));
                    setButtonPressed(false);
                }
            } else setButtonPressed(false);
            console.log("Catched: ", err);
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>  
            <Closebutton/>
            <Chat/>
            { buttonPressed ? 
                (<h2 className="loading"> Updating the Score </h2>) :
                (
                    <Button id="getscore" variant="secondary" onClick={updateScore} size="lg"
                    style={{
                        width:150, 
                        border: "2px solid #ccc",
                        borderRadius: "5px",
                        
                    }}>
                        <label style={{cursor: 'pointer', }} >
                            Get Points
                        </label>
                    </Button>
                )
            }

        <h2 style={{position:"absolute", right: "18%", top: "6%",}}>Score: {score}</h2>
        </div>

    );
}