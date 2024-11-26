import Button from "react-bootstrap/esm/Button";
import { contract, getCode, getSalt, hash, getGame, } from "./utils";

const solutionFilter = contract.filters.SolutionSubmitted(getGame());
const solutionHandler = (code, salt) => {
    console.debug("SolutionSubmitted event occurred:", code, salt);
}

async function submitSolution(){
    console.debug("Selected colors:", getCode()); 
    console.debug("Random Salt:", getSalt());
    console.debug("Hash:",hash(getCode(), getSalt()));
    
    try{
        contract.once(solutionFilter, solutionHandler);

        const tx = await contract.submitSolution(getGame(), getCode(), getSalt());
        const receipt = await tx.wait();
        console.debug(receipt);
        
    } catch(err){
        if (err.code === 'INVALID_ARGUMENT')             alert("Invalid Code.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
        contract.off(solutionFilter, solutionHandler);
    }
}

export default function Solution(){
    return(
        <Button variant="secondary" onClick={submitSolution} size="sm">
            <label style={{padding:10, cursor: 'pointer'}} >
                Reveal
            </label>
        </Button>
    );
}