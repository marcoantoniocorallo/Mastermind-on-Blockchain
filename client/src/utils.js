import { ethers, EtherscanProvider, signer } from "ethers";
import { ABI, CONTRACT_ADDRESS } from "./ABI";
import { hexlify, hexZeroPad } from '@ethersproject/bytes';

export var contract, provider;

export const afk_time = 36000; //ms

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

export function getOldTimer(){
    return window.localStorage.getItem(getAccount()+"_afktimer");
}

export async function setNewTimer(time, on_timeout, tim){
    window.localStorage.setItem(getAccount()+"_afktimer", time);
    return setTimeout(on_timeout, tim);
}

export function removeTimer(timeout){
    clearTimeout(timeout);
    window.localStorage.removeItem(getAccount()+"_afktimer");
}

export function getAfkBlock(){
    return Number(window.localStorage.getItem(getAccount()+"_afkblock"));
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

export function clearGame(){
    const account = getAccount();
    contract.removeAllListeners();
    window.localStorage.clear();
    authenticate(account);
    window.location="/";
}