import { ethers, EtherscanProvider, signer } from "ethers";
import { ABI, CONTRACT_ADDRESS, LOCAL_ADDRESS } from "./ABI";
import red from "./red.png";
import white from "./white.png";
import black from "./black.png";
import yellow from "./yellow.png";
import green from "./green.png";
import blue from "./blue.png";

const CONTRACT = CONTRACT_ADDRESS;  // uncomment this line to run in the sepolia testnet
// const CONTRACT = LOCAL_ADDRESS;  // uncomment this line to run in the hardhat testnet
const PROVIDER = new ethers.providers.Web3Provider(window.ethereum);

export var contract, provider;

export const afk_time = 36000; //ms
export const dispute_time = 36000; //ms

export function init(){
    if (contract === undefined) {
        connectToMastermind();
    }
}

export function getAccount(){
    return window.localStorage.getItem("account");
}

export function setAccount(account){
    window.localStorage.setItem("account",account);
}

export function setFromBlock(blockn = 0){
    window.localStorage.setItem(getAccount()+"_fromblock", blockn);
}

export function getFromBlock(){
    return Number(window.localStorage.getItem(getAccount()+"_fromblock"));
}

export function authenticate(account){
    window.localStorage.setItem("isAuthenticated",true);
    setAccount(account);
}

export function deauthenticate(){
    window.localStorage.removeItem("isAuthenticated");
    window.localStorage.removeItem("account");
}

export function getPhase() { 
    return window.localStorage.getItem(getAccount()+"_phase");
}

export function isAuthenticated(){
    return window.localStorage.getItem("isAuthenticated");
}

export function setPhase(phase){
    window.localStorage.setItem(getAccount()+"_phase", phase);
}

export function setRole(role){
    window.localStorage.setItem(getAccount()+"_role", role);
}

export function getRole(){
    return window.localStorage.getItem(getAccount()+"_role");
}

export function getGame() { 
    return Number(window.localStorage.getItem(getAccount()+"_game")); 
}

export function setGame(game){
    return window.localStorage.setItem(getAccount()+"_game", game); 
}

export function clearChat(){
    window.localStorage.removeItem("chat_messages");
}

export function setStake(stake){
    window.localStorage.setItem(getAccount()+"_stake", stake);
}

export function getStake(){
    return window.localStorage.getItem(getAccount()+"_stake");
}

export function clearStake(){
    window.localStorage.removeItem(getAccount()+"_stake");
}

export function setFirstStake(stake){
    window.localStorage.setItem(getAccount()+"_firstStake", stake);
}

export function removeFirstStake(){
    window.localStorage.removeItem(getAccount()+"_firstStake");
}

export function getFirstStake(){
    return window.localStorage.getItem(getAccount()+"_firstStake")
}

export function setSentStake(){
    window.localStorage.setItem(getAccount()+"_sent", true);
}

export function getSentStake(){
    return window.localStorage.getItem(getAccount()+"_sent");
}

export function removeSentStake(){
    window.localStorage.removeItem(getAccount()+"_sent");
}

export function afkPressed(){
    window.localStorage.setItem(getAccount()+"_afkbutton","AFK");
    document.getElementById("afkbutton").disabled=true;
}

export function removeAfk(){
    window.localStorage.removeItem(getAccount()+"_afkbutton");
    document.getElementById("afkbutton").disabled=false;
}

export function claimButton(){
    window.localStorage.setItem(getAccount()+"_afkbutton","Claim");
}

export function afkButtonStatus(){
    return window.localStorage.getItem(getAccount()+"_afkbutton");
}

export function setCode(code){
    window.localStorage.setItem(getAccount()+"_code",code);
}

export function getCode(){
    const code = window.localStorage.getItem(getAccount()+"_code");
    
    if (!code) {
        return [];
    }
    
    // Split the string by commas, then map each item to a number
    return code.split(",").map((item) => Number(item));
}

export function setSalt(salt){
    window.localStorage.setItem(getAccount()+"_salt",salt);
}

export function getSalt(){
    const salt = window.localStorage.getItem(getAccount()+"_salt");
    
    if (!salt) {
        return [];
    }
    
    // Split the string by commas, then map each item to a number
    return salt.split(",").map((item) => Number(item));
}

export function setTurn(turn){
    window.localStorage.setItem(getAccount()+"_turn",turn);
}

export function getTurn(){
    const tmp = window.localStorage.getItem(getAccount()+"_turn");
    return tmp ? tmp : 0;
}

export function increaseTurn(){
    if (getTurn()) 
        setTurn(Number(getTurn())+1);
    else setTurn(0);
}

export function setGuess(guess){
    window.localStorage.setItem(getAccount()+"_guess"+getTurn(), guess);
}

export function getGuess(){
    return window.localStorage.getItem(getAccount()+"_guess"+getTurn());
}

export function setGuessHistory(h){
    window.localStorage.setItem(getAccount()+"_guesses", h);
}

export function getGuessHistory(){
    return window.localStorage.getItem(getAccount()+"_guesses");
}

export function setFeedback(cc, nc){
    window.localStorage.setItem(getAccount()+"_feedback"+getTurn(), cc+","+nc);
}

export function getFeedback(){
    const tmp = window.localStorage.getItem(getAccount()+"_feedback"+getTurn());
    return tmp? tmp : window.localStorage.getItem(getAccount()+"_feedback"+(Number(getTurn())-1));
}

export function setFeedbackHistory(h){
    window.localStorage.setItem(getAccount()+"_feedbacks", h);
}

export function getFeedbackHistory(){
    return window.localStorage.getItem(getAccount()+"_feedbacks");
}

export function getSolution(){
    return window.localStorage.getItem(getAccount()+"_solution");
}

export function setSolution(s){
    window.localStorage.setItem(getAccount()+"_solution", s);
}

export function setPoints(p){
    window.localStorage.setItem(getAccount()+"_points", p);
}

export function getPoints(){
    const tmp = window.localStorage.getItem(getAccount()+"_points");
    return tmp ? tmp : 0;
}

export function getRound(){
    const tmp = window.localStorage.getItem(getAccount()+"_round");
    return tmp ? Number(tmp) : 0;
}

export function setRound(r){
    window.localStorage.setItem(getAccount()+"_round", r);
}

export function increaseRound(){
    setRound(getRound()+1);
}

export function newRound(){
    window.localStorage.removeItem(getAccount()+"_code");
    window.localStorage.removeItem(getAccount()+"_feedback0");
    window.localStorage.removeItem(getAccount()+"_feedback1");
    window.localStorage.removeItem(getAccount()+"_feedbacks");
    window.localStorage.removeItem(getAccount()+"_guess0");
    window.localStorage.removeItem(getAccount()+"_guess1");
    window.localStorage.removeItem(getAccount()+"_guesses");
    window.localStorage.removeItem(getAccount()+"_solution");
    window.localStorage.removeItem(getAccount()+"_turn");
    increaseRound();
}

export const images = [
    red,  
    blue, 
    yellow,
    green,
    black,
    white,
];

export async function connectToMastermind(){
    provider = PROVIDER;

    //scan from the first block for events
    provider.resetEventsBlock(0);    
    provider.pollingInterval = 500; 
    
    // Get the signer
    const signer = provider.getSigner();

    // Create a contract instance
    contract = new ethers.Contract(CONTRACT, ABI, signer);

    return contract;
}

export async function readLastEvent(topics, fromblock = provider.getBlockNumber() - 10000){
    const iface = new ethers.utils.Interface(ABI);
    const logs = await provider.getLogs({
        address: CONTRACT,
        topics: topics,
        fromBlock: fromblock, 
    });
    if(logs!==undefined && logs.length!==0) return iface.parseLog(logs[logs.length-1]);
}

export async function waitEvent(topics, callback, fromblock = provider.getBlockNumber() - 10000){
    const logs = await provider.getLogs({
        address: CONTRACT,
        topics: topics,
        fromBlock: fromblock, 
    });
    if( logs.length > 0){
        console.debug(logs);
        logs.forEach(element => {
            console.debug(element.topics);
        });
        callback();
        return logs[logs.length-1];
    }
}

export async function wait2Events(topics, callback){
    const logs = await provider.getLogs({
        address: CONTRACT,
        topics: topics,
        fromBlock: provider.getBlockNumber() - 10000, 
    });
    if(logs.length === 2){
        console.debug(logs);
        logs.forEach(element => {
            console.debug(element.topics);
        });
        callback();
        return logs;
    };
}

export function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return "0x"+hex;
}

export function clearGame(){
    const account = getAccount();
    contract.removeAllListeners();
    window.localStorage.clear();
    authenticate(account);
    window.location="/";
}

export function hash(code, salt) {
    // Concatenate enums and salt as bytes
    const data = Uint8Array.from([...code, ...salt]);

    // Hash the raw byte data
    return ethers.utils.keccak256(data);
}