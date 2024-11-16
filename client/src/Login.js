import { React } from "react";
import LoginHeader from './LoginHeader';
import './App.css';
import MetamaskButton from "./MetamaskButton";

export default function Login() {

  return( 
      <div className="App">
        <LoginHeader/>
        <MetamaskButton/>
      </div>
  );
}