import React, { useState, useEffect } from "react";
import { contract, getGame, getGuessHistory, setGuess, setGuessHistory, setPhase, getRole, images } from "./utils";

const GuessesWindow = () => {
  const [stack, setStack] = useState([]); // Stack of sent codes

  const guessFilter = contract.filters.GuessSent(getGame());
  const guessListener = (id, who, colors) =>{
    console.debug("GuessSent event occurred:", id, who, colors);
    setGuess(colors);

    // Map colors to image paths
    const newCode = {
      id, 
      images: colors.map((colorIndex) => images[colorIndex]),
    };

    // Update the stack with the new code
    setStack((prevStack) => [...prevStack, newCode]);

    // update phase
    setPhase("feedback");
    if (getRole()==="CodeMaker"){
        document.getElementById('CC_text').disabled=false;
        document.getElementById('NC_text').disabled=false;
    } else 
        document.getElementById('gbutton').disabled=true;
  }

  useEffect(() => {
    contract.on(guessFilter, guessListener);

    return () => { contract.off(guessFilter, guessListener); };
  }, []);

  // Load data from localStorage when the component mounts
  useEffect(() => {
    const savedStack = getGuessHistory();
    if (savedStack) {
      setStack(JSON.parse(savedStack));
    }
  }, []);

  // Save the stack to localStorage whenever it changes
  useEffect(() => {
    setGuessHistory(JSON.stringify(stack));
  }, [stack]);

  return (
    <div style={{ padding: "10px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

      {/* Stack of Indexes */}
      <div
        style={{
          position: "absolute",
          right: "340px",
          top: "100px",
          borderRadius: "5px",
          padding: "10px",
          height: "500px",
          width: "190px",
          overflowY: "auto",
        }}
      >
        {stack.length === 0 ? ("") : 
        (
          stack.map((code, index) => (
            <div key={index}>
              <div style={{ display: "flex", marginTop: "1%", fontSize:22, paddingTop:"1.1%"}}>
                <p>{index}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stack of Sent Codes */}
      <div
        style={{
          position: "absolute",
          right: "300px",
          top: "100px",
          border: "2px solid #ccc",
          borderRadius: "5px",
          padding: "10px",
          height: "500px",
          width: "190px",
          overflowY: "auto",
        }}
      >
        {stack.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>No codes sent yet</p>
        ) : (
          stack.map((code, index) => (
            <div key={index}>
              <div style={{ display: "flex", }}>
                {code.images.map((img, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={img}
                    alt={`Code ${index} Image ${imgIndex}`}
                    style={{
                      width: "40px",
                      height: "40px",
                      marginTop: "10px"
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GuessesWindow;
