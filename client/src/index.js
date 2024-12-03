import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import reportWebVitals from './reportWebVitals';
import './index.css';
import NewGame from './NewGame';
import Wait from './Wait';
import Stake from './Stake';
import Game from "./Game";
import Solution from './Solution';
import UpdateScore from './UpdateScore';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getPhase, provider, init, authenticate, deauthenticate, isAuthenticated} from './utils';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (window.ethereum){
  init();
  const accounts = await provider.listAccounts();
  if (accounts.length === 0)
    deauthenticate();

  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0)
      deauthenticate();
    else 
      authenticate(accounts[0]);
    window.location="/";
  });

  window.ethereum.on('chainChanged', () => window.location.reload());
}

const pageOf = {
  null :  isAuthenticated() ? <NewGame/> : <Login/>,
  "" :    isAuthenticated() ? <NewGame/> : <Login/>,
  "creation" : isAuthenticated() ? <Wait/> : <Login/>,
  "declaration" : isAuthenticated() ? <Stake/> : <Login/>,
  "preparation" : isAuthenticated() ? <Stake/> : <Login/>,
  "secretcode"  : isAuthenticated() ? <Game/> : <Login/>,
  "guess"       : isAuthenticated() ? <Game/> : <Login/>,
  "feedback"    : isAuthenticated() ? <Game/> : <Login/>,
  "solution"    : isAuthenticated() ? <Solution/> : <Login/>,
  "score"       : isAuthenticated() ? <UpdateScore/> : <Login/>,
}

root.render(
    <BrowserRouter>
      <Routes>
        <Route
          path='/'
          element={pageOf[getPhase()]}
        />
      </Routes>
    </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
