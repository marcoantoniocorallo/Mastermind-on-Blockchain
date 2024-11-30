import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/esm/Button";
import Form from 'react-bootstrap/Form'; 
import { contract, getCode, getSalt, hash, getGame, getRole, setSolution, getSolution, getAccount, 
    clearGame, getGuessHistory, getFeedbackHistory
} from "./utils";
import red from "./red.png";
import white from "./white.png";
import black from "./black.png";
import yellow from "./yellow.png";
import green from "./green.png";
import blue from "./blue.png";
import AFKButton from "./AFKButton";
import FeedbacksWindow from "./FeedbacksWindow";
import GuessesWindow from "./GuessesWindow";
import logo from './logo.png';
import Closebutton from "./Closebutton";

async function onDispute(feedback_n){
    try{
        const tx = await contract.startDispute(getGame(), feedback_n);
        const receipt = await tx.wait();
        console.debug(receipt);

    } catch(err){
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
}

// List of available images (use URLs or import local assets)
const images = [
    red,  
    blue, 
    yellow,
    green,
    black,
    white,
  ];

export default function Solution(){
    const [solution, setSol] = useState([]);

    async function submitSolution(){
        console.debug("Selected colors:", getCode()); 
        console.debug("Random Salt:", getSalt());
        console.debug("Hash:",hash(getCode(), getSalt()));
        
        try{
            const tx = await contract.submitSolution(getGame(), getCode(), getSalt());
            const receipt = await tx.wait();
            console.debug(receipt);
            
        } catch(err){
            if (err.code === 'INVALID_ARGUMENT')             alert("Invalid Code.");
            else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
            console.log("Catched: ", err);
        }
    }

    const solutionFilter = contract.filters.SolutionSubmitted(getGame());
    const solutionHandler = (id, code, salt) => {
        console.debug("SolutionSubmitted event occurred:", id, code, salt);

        setSol(code);
        setSolution(code);

        contract.once(contract.filters.Punished(getGame()),(id, who) => {
            if (who.toLowerCase() === getAccount()) alert("You were punished for cheating.");
            else                                    alert("You won this game.");
            clearGame();
        });

        if (getRole()==="CodeMaker")
            alert("Dispute Time started");

        // TODO: Timeout ==> button updateScore && contract.off(contract.filters.Punished(Number(getGame())));
    }

    // use effect => listen ONCE sentsolution to enable "dispute" (and start timeout)
    useEffect(() => {
        console.debug("Listener activated");
        contract.once(solutionFilter, solutionHandler);

        return () => { contract.off(solutionFilter, solutionHandler); }
    }, []);


    // Load data from localStorage when the component mounts
    useEffect(() => {
        const savedSol = getSolution();
        if (savedSol) {
            setSol(JSON.parse(savedSol));
        }
    }, []);
  
    // Save the stack to localStorage whenever it changes
    useEffect(() => {
        setSolution(JSON.stringify(solution));
    }, [solution]);

    return(
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>
            <h2 style={{position:"absolute", top:"20%", left:"5%"}}>You are the {getRole()}</h2>
            
            {/* Guesses Window */}
            <div style={{ padding: "10px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

            {/* Stack of Indexes */}
            <div
                style={{
                position: "absolute",
                right: "340px",
                top: "100px",
                borderRadius: "5px",
                padding: "10px",
                height: "500px",
                width: "190px",
                overflowY: "auto",
                }}
            >
                {
                (
                JSON.parse(getGuessHistory()).map((code, index) => (
                    <div key={index}>
                    <div style={{ display: "flex", marginTop: "1%", fontSize:22, paddingTop:"1.1%"}}>
                        <p>{index}</p>
                    </div>
                    </div>
                ))
                )}
            </div>

            {/* Stack of Sent Codes */}
            <div
                style={{
                position: "absolute",
                right: "300px",
                top: "100px",
                border: "2px solid #ccc",
                borderRadius: "5px",
                padding: "10px",
                height: "500px",
                width: "190px",
                overflowY: "auto",
                }}
            >
                { (
                JSON.parse(getGuessHistory()).map((code, index) => (
                    <div key={index}>
                    <div style={{ display: "flex", }}>
                        {code.images.map((img, imgIndex) => (
                        <img
                            key={imgIndex}
                            src={img}
                            alt={`Code ${index} Image ${imgIndex}`}
                            style={{
                            width: "40px",
                            height: "40px",
                            marginTop: "10px"
                            }}
                        />
                        ))}
                    </div>
                    </div>
                ))
                )}
            </div>
            </div>

            {/* Feedback Windows */}
            <div style={{ padding: "10px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

            {/* Stack of Sent Codes */}
            <div
                style={{
                position: "absolute",
                right: "100px",
                top: "100px",
                border: "2px solid #ccc",
                borderRadius: "5px",
                padding: "10px",
                height: "500px",
                width: "180px",
                overflowY: "auto",
                }}
            >
                {(
                JSON.parse(getFeedbackHistory()).map((entry, index) => (
                    <div key={index}>
                    <div style={{ display: "flex", gap:"20px", marginTop: "10%"}}>
                        <h6 style={{gap:"10px", color:"#78e878", fontSize:22}}> CC: {entry.cc}</h6>
                        <h6 style={{gap:"10px", color:"#fa685d", fontSize:22}}> NC: {entry.nc}</h6>
                    </div>
                    </div>
                ))
                )}
            </div>
            </div>

            {getRole() === "CodeMaker" ?
            (
                <Button id="solbut" variant="secondary" onClick={submitSolution} size="lg"
                    style={{
                        width:150, 
                        border: "2px solid #ccc",
                        borderRadius: "5px",
                        
                    }}>
                    <label style={{cursor: 'pointer', }} >
                        Reveal
                    </label>
                </Button>
            ) :
            (
                <>
                <div style={{ padding: "20px", position:"absolute" , top:"30%",
                    border: "2px solid #ccc",
                    borderRadius: "5px",
                }}>
            
                    <h3>Solution:</h3>
                    <div style={{ display: "flex", justifyContent:'center', alignItems:'center', }}>
                    {solution.map(index => (
                        <img 
                        key={index} 
                        src={images[index]} 
                        style={{ width: "40px", height: "40px", borderRadius: "5px" }}
                        />
                    ))}
                    </div>
                </div>
                <Button id="sol_button" variant="secondary" style={{cursor: 'default'}} disabled={!getSolution()} size="lg">
                        <label style={{padding:10, cursor: 'pointer' }} 
                            onClick={() => onDispute(document.getElementById('feedback_n').value)}>
                            Start a Dispute
                        </label>
                        <Form.Control required
                            style={{ marginLeft:30, marginRight:20, width: 120, height: 30 }} 
                            id="feedback_n" size="sm" placeholder="Feedback n." type='number'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onDispute(e.target.value);
                                }
                            }}
                        />
                </Button>
                </>
            )}

            <Closebutton/>
            <AFKButton/>
        </div>
    );
}