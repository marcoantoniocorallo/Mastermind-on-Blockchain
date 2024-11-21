import { ethers, EtherscanProvider, signer } from "ethers";
import { ABI, CONTRACT_ADDRESS } from "./ABI";
import { hexlify, hexZeroPad } from '@ethersproject/bytes';

export var contract, provider;

export const afk_time = 36000; //ms

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

export function setFromBlock(blockn = 0){
    window.localStorage.setItem(getCurrentAccount()+"_fromblock", blockn);
}

export function getFromBlock(){
    return Number(window.localStorage.getItem(getCurrentAccount()+"_fromblock"));
}

export function authenticate(account){
    window.localStorage.setItem("isAuthenticated",true);
    setCurrentAccount(account);
    setFromBlock();
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

function setRole(account, role){
    window.localStorage.setItem(account+"_role", role);
}

export function setRoles(codemaker, codebreaker){
    setRole(codemaker,"codemaker");
    setRole(codebreaker,"codebreaker");
}

export function getRole(){
    return window.localStorage.getItem(getCurrentAccount()+"_role");
}

export function getCurrentGame() { 
    return window.localStorage.getItem(getCurrentAccount()+"_game"); 
}

export function setCurrentGame(game){
    return window.localStorage.setItem(getCurrentAccount()+"_game", game); 
}

export function clearChat(){
    window.localStorage.removeItem("chat_messages");
}

export function setCurrentStake(stake){
    window.localStorage.setItem(getCurrentAccount()+"_stake", stake);
}

export function getCurrentStake(){
    return window.localStorage.getItem(getCurrentAccount()+"_stake");
}

export function clearCurrentStake(){
    window.localStorage.removeItem(getCurrentAccount()+"_stake");
}

export function afkPressed(){
    window.localStorage.setItem(getCurrentAccount()+"_afkbutton","AFK");
    document.getElementById("afkbutton").disabled=true;
}

export function afkButtonStatus(){
    return window.localStorage.getItem(getCurrentAccount()+"_afkbutton");
}

export function getOldTimer(){
    return window.localStorage.getItem(getCurrentAccount()+"_afktimer");
}

export async function setNewTimer(time, on_timeout, tim){
    window.localStorage.setItem(getCurrentAccount()+"_afktimer", time);
    window.localStorage.setItem(getCurrentAccount()+"_afkblock", await provider.getBlockNumber());
    return setTimeout(on_timeout, tim);
}

export function removeTimer(timeout){
    clearTimeout(timeout);
    window.localStorage.removeItem(getCurrentAccount()+"_afktimer");
}

export function getAfkBlock(){
    return Number(window.localStorage.getItem(getCurrentAccount()+"_afkblock"));
}

export function removeAfk(){
    window.localStorage.removeItem(getCurrentAccount()+"_afkbutton");
    document.getElementById("afkbutton").disabled=false;
}

export function claimButton(){
    window.localStorage.setItem(getCurrentAccount()+"_afkbutton","Claim");
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

export async function readLastEvent(topics, fromblock = provider.getBlockNumber() - 10000){
    const iface = new ethers.utils.Interface(ABI);
    const logs = await provider.getLogs({
        address: CONTRACT_ADDRESS,
        topics: topics,
        fromBlock: fromblock, 
    });
    if(logs!==undefined && logs.length!==0) return iface.parseLog(logs[logs.length-1]);
}

export async function waitEvent(topics, callback, fromblock = provider.getBlockNumber() - 10000){
    const logs = await provider.getLogs({
        address: CONTRACT_ADDRESS,
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
        address: CONTRACT_ADDRESS,
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

export async function listenLeft(intervalid){
    await waitEvent(
        [
            ethers.utils.id("GameLeft(uint256,address)"),
            hexZeroPad(ethers.utils.hexlify(Number(getCurrentGame())), 32),
        ],
        () => {
            alert("A player left the game.");
            setCurrentPhase(""); 
            window.location="/";
            clearInterval(intervalid);
        }
    );
}