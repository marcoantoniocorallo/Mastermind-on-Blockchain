import logo from "./logo.png";
import Button from "react-bootstrap/esm/Button";
import Closebutton from "./Closebutton";
import Score from "./Score";
import { contract, getGame, setPoints, setPhase, setRole, getRole, setTurn, increaseRound, newRound  } from "./utils";
import { useState } from "react";

const scoreFilter = contract.filters.PointsUpdated(getGame());

export default function UpdateScore(){
    const [buttonPressed, setButtonPressed] = useState(false);

    contract.once(scoreFilter, (id, score) => {
        console.debug("PointsUpdated event occurred:",id,score);
        if (getRole()==="CodeMaker") setPoints(score);
        setPhase("secretcode");
        setRole(getRole() === "CodeMaker" ? "CodeBreaker" : "CodeMaker");
        newRound();
        window.location="/";
    });

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
            } 
            console.log("Catched: ", err);
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>  
            <Closebutton/>

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

            <Score/>
        </div>

    );
}