import { authenticate, connectToMastermind } from "./utils";

async function metamaskDownload() {
    window.open('https://metamask.io/it/download');
}

async function metamaskConnect() {
    try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        authenticate();
        connectToMastermind();
        window.location="/";
    } catch (err) {
        if (err.code === -32002) alert("Login request pending.");
        else console.error(err);
    }
}

export default function MetamaskButton(){
    return(
        window.ethereum ? 
            <button className="metamaskButton" role="button" onClick={metamaskConnect}>Login</button> :
            <button className="metamaskButton" role="button" onClick={metamaskDownload}>Download</button>
    );
}