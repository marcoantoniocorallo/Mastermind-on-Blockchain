import { ethers, EtherscanProvider, signer } from "ethers";
import { ABI, CONTRACT_ADDRESS } from "./ABI";

export var contract, provider;

export function init(){
    if (contract === undefined) {
        connectToMastermind();
    }
    const account = getCurrentAccount();
}

export function getCurrentAccount(){
    return window.localStorage.getItem("account");
}

export function setCurrentAccount(account){
    window.localStorage.setItem("account",account);
}

export function authenticate(account){
    window.localStorage.setItem("isAuthenticated",true);
    setCurrentAccount(account);
}

export function deauthenticate(){
    window.localStorage.setItem("isAuthenticated","");
    setCurrentAccount("");
}

export function getCurrentPhase() { 
    return window.localStorage.getItem(getCurrentAccount()+"_phase"); 
}

export function isAuthenticated(){
    return window.localStorage.getItem("isAuthenticated");
}

export function setCurrentPhase(phase){
    window.localStorage.setItem(getCurrentAccount()+"_phase", phase);
}

export function getCurrentGame() { 
    return window.localStorage.getItem(getCurrentAccount()+"_game"); 
}

export async function connectToMastermind(){
    provider = new ethers.providers.Web3Provider(window.ethereum, 'sepolia');

    //scan from the first block for events
    provider.resetEventsBlock(0);    
    provider.pollingInterval = 500; 
    
    // Get the signer
    const signer = provider.getSigner();

    // Create a contract instance
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    return contract;
}

export async function leaveGame(game_id){  
    init();

    try{
        const tx = await contract.leaveGame(game_id);
        const receipt = await tx.wait();
        console.debug(receipt);
        setCurrentPhase("");
        window.location="/";
    } catch(err){
        if (err.code === 'INVALID_ARGUMENT') 
            alert("Invalid Game ID.");
        if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err.message);
    }
}