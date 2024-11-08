import { useState } from "react";
import { userContext } from "./Context";

async function metamaskDownload() {
    window.open('https://metamask.io/it/download');
}

async function metamaskConnect(setUser) {
    try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setUser(accounts[0]);
        window.location="/chooseGame";
        userContext.Provider({login:true, address:accounts[0]});
    } catch (err) {
        if (err.code === -32002) alert("Login request pending.");
        else console.error(err);
    }
}

export default function MetamaskButton(){
    const [user, setUser] = useState('');

    return(
        window.ethereum ? 
            <button className="metamaskButton" role="button" onClick={
                () => metamaskConnect(setUser)
            }>Login</button> :
            <button className="metamaskButton" role="button" onClick={metamaskDownload}>Download</button>
    );
}