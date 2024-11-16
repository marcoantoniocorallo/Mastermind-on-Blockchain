import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import reportWebVitals from './reportWebVitals';
import './index.css';
import NewGame from './NewGame';
import Wait from './Wait';
import Stake from './Stake';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getCurrentPhase, provider, init, setCurrentAccount, authenticate, deauthenticate, isAuthenticated } from './utils';
import Chat from './Chat';

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
}

const pageOf = {
  null :  isAuthenticated() ? <NewGame/> : <Login/>,
  "" :    isAuthenticated() ? <NewGame/> : <Login/>,
  "creation" : isAuthenticated() ? <Wait/> : <Login/>,
  "declaration" : isAuthenticated() ? <Stake/> : <Login/>,
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path='/'
          element={pageOf[getCurrentPhase()]}
        />
        <Route // TODO: to remove
          path='/test'
          element={<Stake/>}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
