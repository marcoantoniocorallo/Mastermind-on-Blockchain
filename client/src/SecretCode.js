import React, { useState } from "react";
import { ethers } from "ethers";
import { getRole } from "./utils";
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

function hash(code, salt) {
    // Concatenate enums and salt as bytes
    const data = Uint8Array.from([...code, ...salt]);

    // Hash the raw byte data
    return ethers.utils.keccak256(data);
}

export default function SecretCode(){
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedIndexes, setSelectedIndexes] = useState([]);

    function submit(){
        if (selectedImages.length == 4) {
            return (
                <ButtonGroup size='sm'>
                    <Button variant="primary">
                        <label 
                            style={{padding:10, cursor: 'pointer' }} 
                            onClick={() => {
                                const salt = generateSalt();
                                console.debug("Selected colors:",selectedIndexes); 
                                console.debug("Random Salt:", salt);
                                console.debug("Hash:",hash(selectedIndexes, [0, 0, 0, 0, 0]));
                                // contract.submitcode
                            }}>
                            Submit
                        </label>
                    </Button>
                    <Button variant="primary">
                        <label 
                            style={{padding:10, cursor: 'pointer' }} 
                            onClick={() => {window.location="/test";}}>
                            Clear
                        </label>
                    </Button>

                </ButtonGroup>
            );
        }
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
    <div style={{ padding: "20px" }}>
      {/* Selected Images Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Secret Code:</h3>
        <div style={{ display: "flex" }}>
          {selectedImages.map((img, index) => (
            <img 
              key={index} 
              src={img} 
              alt={`Selected ${index}`} 
              style={{ width: "50px", height: "50px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
          ))}
          {submit()}
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
              style={{ width: "50px", height: "50px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}