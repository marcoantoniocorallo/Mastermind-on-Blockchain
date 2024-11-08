import { MetaMaskSDK } from "@metamask/sdk";
// import detectEthereumProvider from "@metamask/detect-provider";
import { React, useContext, useState } from "react";
import LoginHeader from './LoginHeader';
import './App.css';
import MetamaskButton from "./MetamaskButton";
import { Navigate, Outlet } from "react-router-dom";
import { userContext } from "./Context";
import NewGame from "./NewGame";

export default function Login() {
  window.ethereum.on("disconnect", () => userContext.Provider({login:false, address:null}) );
  let login = useContext(userContext).login;
  return( login? <Navigate to="/chooseGame"></Navigate> : 
    <div className="App">
      <LoginHeader/>
      <MetamaskButton/>
    </div>
  );
}

  //const provider = await detectEthereumProvider()
  /*
  const [showAccountAdd, setShowAccountAdd] = useState(true);
  const [addressOfAccount, setAddressOfAccount] = useState("");
  const [addressOfContract, setAddressOfContract] = useState(null);
  const [contract, setContract] = useState(null);

  const connectAccountHandler = () => {
    // open the metamask menu to select an account to use
    if (window.ethereum) {
        window.ethereum
            .request({ method: "eth_requestAccounts" })
            .then((result) => {
                accoutChangeHandler(result[0]);
                setShowAccountAdd(false);
            });
    } else {
        alert("Need to install MetaMask!");
    }
  };

  //sets the address of the user account on the GUI update the contract object
  const accoutChangeHandler = (newAccount) => {
    //set the address of the current in the global state variable
    setAddressOfAccount(newAccount);
    if (addressOfContract != null) {
        updateEthers(addressOfContract); //set the current contract being used
    }
  };

  const updateEthers = (contractAddress) => {
    //set a global contract object with a signer (allows to execute normal functions instead of just view functions)
    let tempProvider = new ethers.providers.Web3Provider(window.ethereum); //select web3provider which binds to the ganache local network
    let tempSigner = tempProvider.getSigner(); //allow both  read and write operations with the contract
    let tempContract = new ethers.Contract(
        contractAddress,
        abi,
        tempSigner
    );
    setContract(tempContract); //set the constant global variable contract to the new contract object which allows reads and writes op
  };
  */

  

  /*
  return (
    <>
      {
        window.ethereum ? 
        (
          window.ethereum
              .request({ method: "eth_requestAccounts" })
              .then((result) => {
                  console.log(result[0]);
                  // accoutChangeHandler(result[0]);
                  //setShowAccountAdd(false);
              })
        )
        : <p>Install MetaMask to play MasterMind.</p>
      }
    </>
  );
  */