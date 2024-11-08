import logo from './logo.png';

export default function LoginHeader(){
    return (
        <header className="Login-header">
            <img src={logo} className="Login-logo" alt="logo" />
        </header>
    );
}