import { getPoints } from "./utils";

export default function Score(){
    return(
        <h2 style={{position:"absolute", right: "18%", top: "6%",}}>Score: {getPoints()}</h2>
    );
}