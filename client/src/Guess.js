import React, { useState } from "react";
import { ethers } from "ethers";
import { contract, getCode, getGame, getRole, getSalt, setCode, setPhase, setSalt, hash, setGuess, getTurn, getPhase } from "./utils";
import red from "./red.png";
import white from "./white.png";
import black from "./black.png";
import yellow from "./yellow.png";
import green from "./green.png";
import blue from "./blue.png";
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

export default function Guess(){
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedIndexes, setSelectedIndexes] = useState([]);

    async function submitCode(code){
      console.debug("Selected colors:",code); 
      setGuess(code);
      
      try{
          const tx = await contract.sendGuess(code, getGame());
          const receipt = await tx.wait();
          console.debug(receipt);       
          setSelectedImages([]);
          setSelectedIndexes([]);
      } catch(err){
          if (err.code === 'INVALID_ARGUMENT')             alert("Invalid Guess.");
          else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
          console.log("Catched: ", err);
      }
    }

    function submit(){
        return (
            <ButtonGroup size='sm' style={{padding: "30px"}} id="gbutton" >
                <Button variant="secondary" onClick={() => { submitCode(selectedIndexes) }} 
                  disabled={selectedImages.length != 4}>
                    <label style={{padding:10, cursor: 'pointer', fontSize:20 }} >
                        Submit
                    </label>
                </Button>
                <Button variant="secondary" onClick={() => {setSelectedImages([]); setSelectedIndexes([]);}}>        
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
    <div style={{ padding: "20px", position:"absolute", top:"30%", left:"5%" }}>
      {/* Selected Images Section */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent:'center', alignItems:'center', }}>
        <h3>Guess:
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
  );
}