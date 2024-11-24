import SecretCode from "./SecretCode";
import Closebutton from "./Closebutton";
import AFKButton from './AFKButton';
import logo from './logo.png';
import { getRole } from "./utils";

export default function Game(){
    <div className="App">
        <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
        </header>
        <h2>You are the {getRole()}</h2>
        {
            getRole() === "CodeMaker" ? 
            <SecretCode/> : <h2 className="loading">CodeMaker is chosing the secret code...</h2>
        }
        <Closebutton/>
        <AFKButton/>
    </div>
}