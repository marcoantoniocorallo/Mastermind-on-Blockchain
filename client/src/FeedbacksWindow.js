import React, { useState, useEffect } from "react";
import { contract, getGame, getFeedbackHistory, setFeedback, setFeedbackHistory, setPhase, 
  increaseTurn, getRole, getTurn
} from "./utils";

const FeedbacksWindow = () => {
  let n_feedbacks = getTurn();
  const [stack, setStack] = useState([]); // Stack of sent codes

  const fbFilter = contract.filters.FeedbackSent(getGame());
  const fbListener = (id, who, CC, NC) =>{
    console.debug("FeedbackSent event occurred:", id, who, CC, NC);
    n_feedbacks++;
    setFeedback(CC,NC);

    // Map colors to image paths
    const newFeedback = { cc: CC,  nc: NC };

    // Update the stack with the new code
    setStack((prevStack) => [...prevStack, newFeedback]);

    // update phase
    if (CC == 4 || getTurn() == 8 || n_feedbacks == 8){
      console.debug("Last Feedback: CC=", CC, " Turn=", getTurn());
      setPhase("solution");
      window.location="/";
    } else{
      setPhase("guess");
      increaseTurn(); 
      if (getRole()==="CodeMaker"){
        document.getElementById('CC_text').disabled=true;
        document.getElementById('NC_text').disabled=true;
      } else
        document.getElementById('gbutton').disabled=false;
    }
  };

  useEffect(() => {
    contract.on(fbFilter, fbListener);

    return () => { contract.off(fbFilter, fbListener); }
  }, []);

  // Load data from localStorage when the component mounts
  useEffect(() => {
    const savedStack = getFeedbackHistory();
    if (savedStack) {
      setStack(JSON.parse(savedStack));
    }
  }, []);

  // Save the stack to localStorage whenever it changes
  useEffect(() => {
    setFeedbackHistory(JSON.stringify(stack));
  }, [stack]);

  return (
    <div style={{ padding: "10px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

      {/* Stack of Sent Codes */}
      <div
        style={{
          position: "absolute",
          right: "100px",
          top: "100px",
          border: "2px solid #ccc",
          borderRadius: "5px",
          padding: "10px",
          height: "500px",
          width: "180px",
          overflowY: "auto",
        }}
      >
        {stack.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>No Feedback arrived yet</p>
        ) : (
          stack.map((entry, index) => (
            <div key={index}>
              <div style={{ display: "flex", gap:"20px", marginTop: "10%"}}>
                <h6 style={{gap:"10px", color:"#78e878", fontSize:22}}> CC: {entry.cc}</h6>
                <h6 style={{gap:"10px", color:"#fa685d", fontSize:22}}> NC: {entry.nc}</h6>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbacksWindow;
