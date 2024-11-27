import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contract, getCode, getGame, setTurn, setCode, setPhase, setSalt, hash, getPhase } from "./utils";
import red from "./red.png";
import white from "./white.png";
import black from "./black.png";
import yellow from "./yellow.png";
import green from "./green.png";
import blue from "./blue.png";
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

function generateSalt(){
    const randomNumbers = [];
    for (let i = 0; i < 5; i++) {
        randomNumbers.push(Math.floor(Math.random() * 256));
    }
    return randomNumbers;
}

async function submitCode(code){
    const salt = generateSalt();
    console.debug("Selected colors:",code); 
    console.debug("Random Salt:", salt);
    console.debug("Hash:",hash(code, salt));

    setSalt(salt);
    setCode(code);
    
    try{
        const tx = await contract.sendCode(hash(code,salt), getGame());
        const receipt = await tx.wait();
        console.debug(receipt);
        setPhase("guess");
        setTurn(0);
        window.location="/";
        
    } catch(err){
        if (err.code === 'INVALID_ARGUMENT')             alert("Invalid Code.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
}

export default function SecretCode(){
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedIndexes, setSelectedIndexes] = useState([]);
    const [secretCode, setSecretCode] = useState([]);

    // Load data from localStorage when the component mounts
    useEffect(() => {
      const savedCode = getCode();
      if (savedCode) {
        setSecretCode(savedCode);
      }
    }, []);

    // Save the stack to localStorage whenever it changes
    useEffect(() => {
      setCode(secretCode);
    }, [secretCode]);

    function submit(){
        return (
            <ButtonGroup size='sm' style={{padding: "30px"}}>
                <Button variant="secondary" onClick={() => { submitCode(selectedIndexes) }} disabled={selectedImages.length != 4}>
                    <label style={{padding:10, cursor: 'pointer', fontSize:20 }} >
                        Submit
                    </label>
                </Button>
                <Button variant="secondary" onClick={() => {window.location="/";}}>
                    <label style={{padding:10, cursor: 'pointer', fontSize:20 }} >
                        Clear
                    </label>
                </Button>

            </ButtonGroup>
        );
    }

  // List of available images (use URLs or import local assets)
  const images = [
    red,  
    blue, 
    yellow,
    green,
    black,
    white,
  ];

  // Handle image selection
  const handleSelectImage = (image, index) => {
    if (selectedImages.length < 4) {
        setSelectedImages([...selectedImages, image]); // Add to selected list
        setSelectedIndexes([...selectedIndexes, index]);
    } 
  };

  return (
    getPhase() === "secretcode" ? 
    (// Choose secret Code
      <div style={{ padding: "20px", position:"absolute", top:"30%", left:"5%" }}>
        
        {/* Selected Images Section */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent:'center', alignItems:'center', }}>
          <h3>Secret Code:
            {selectedImages.map((img, index) => (
              <img 
                key={index} 
                src={img} 
                alt={`Selected ${index}`} 
                style={{ width: "40px", height: "40px", borderRadius: "5px" }}
              />
            ))}
          </h3>
          </div>
        </div>

        {/* Images to Choose From */}
        <div style={{ display: "flex", gap: "5px", justifyContent:'center', alignItems:'center',}}>
          {images.map((img, index) => (
            <div
              key={index} 
              onClick={() => handleSelectImage(img, index)} 
              style={{ cursor: "pointer", textAlign: "center" }}
            >
              <img 
                src={img} 
                style={{ width: "50px", height: "50px", borderRadius: "15px", border: "1px solid #ccc" }}
              />
            </div>
          ))}
        </div>
        {submit()} 
      </div>
    ) : 
    
    (// Show secret Code to codemaker
      <div style={{ padding: "20px", position:"absolute", top:"30%", left:"7%" ,
        border: "2px solid #ccc",
        borderRadius: "5px",
      }}>

        <h3>Secret Code:</h3>
          <div style={{ display: "flex", justifyContent:'center', alignItems:'center', }}>
            {secretCode.map(index => (
              <img 
                key={index} 
                src={images[index]} 
                style={{ width: "40px", height: "40px", borderRadius: "5px" }}
              />
            ))}
          
          </div>
        </div>
    )
  );
}