import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/esm/Button";
import Form from 'react-bootstrap/Form'; 
import { contract, getCode, getSalt, hash, getGame, getRole, setSolution, getSolution, getAccount, clearGame } from "./utils";
import red from "./red.png";
import white from "./white.png";
import black from "./black.png";
import yellow from "./yellow.png";
import green from "./green.png";
import blue from "./blue.png";

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
            document.getElementById("solbut").disabled=true;
            
        } catch(err){
            if (err.code === 'INVALID_ARGUMENT')             alert("Invalid Code.");
            else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
            console.log("Catched: ", err);
            document.getElementById("solbut").disabled=false;
        }
    }

    const solutionFilter = contract.filters.SolutionSubmitted(getGame());
    const solutionHandler = (id, code, salt) => {
        console.debug("SolutionSubmitted event occurred:", id, code, salt);

        setSol(code);
        setSolution(code);

        if (getRole()==="CodeMaker")
            alert("Dispute Time started");

        contract.once(contract.filters.Punished(Number(getGame())),(id, who) => {
            if (who.toLowerCase() === getAccount()) alert("You were punished for cheating.");
            else                                    alert("You won this game.");
            clearGame();
        });

        // TODO: Timeout ==> button updateScore && contract.off(contract.filters.Punished(Number(getGame())));
    }

    // use effect => listen ONCE sentsolution to enable "dispute" (and start timeout)
    useEffect(() => {
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
        getRole() === "CodeMaker" ?
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
        )
    );
}