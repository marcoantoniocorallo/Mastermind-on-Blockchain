import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentAccount, setCurrentAccount] = useState(null);
  const [chatSize, setChatSize] = useState({ width: 300, height: 300 });
  const [minimized, setMinimized] = useState(false);
  const [resizing, setResizing] = useState(false);

  const checkMetaMask = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      }
    } else {
      alert("MetaMask non è installato! Per favore installala per usare questa funzionalità.");
    }
  };

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setCurrentAccount(accounts[0]);
      } catch (err) {
        console.error("Connessione MetaMask fallita:", err);
      }
    } else {
      alert("MetaMask non è installato!");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setCurrentAccount(accounts[0] || null);
      });
    }
    checkMetaMask();
    loadMessages();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  const saveMessages = (messages) => {
    localStorage.setItem("chat_messages_global", JSON.stringify(messages));
  };

  const loadMessages = () => {
    const savedMessages = localStorage.getItem("chat_messages_global");
    setMessages(savedMessages ? JSON.parse(savedMessages) : []);
  };

  const handleSend = () => {
    if (input.trim() === "" || !currentAccount) return;

    const newMessages = [
      ...messages,
      { user: currentAccount, text: input },
    ];

    setMessages(newMessages);
    saveMessages(newMessages);
    setInput("");
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setResizing(true);
  
    const initialWidth = chatSize.width;
    const initialHeight = chatSize.height;
    const initialX = e.clientX;
    const initialY = e.clientY;
  
    const handleResize = (resizeEvent) => {
      const deltaX = initialX - resizeEvent.clientX; // Cambiato segno
      const deltaY = initialY - resizeEvent.clientY; // Cambiato segno
  
      setChatSize({
        width: Math.max(200, initialWidth + deltaX),
        height: Math.max(200, initialHeight + deltaY),
      });
    };
  
    const stopResize = () => {
      setResizing(false);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    };
  
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
  };
  

  return (
    <div
      style={{
        ...styles.container,
        width: minimized ? "50px" : `${chatSize.width}px`,
        height: minimized ? "50px" : `${chatSize.height}px`,
      }}
    >
      {!minimized && (
        <>
          <div style={styles.header}>
            <p>Chat for Stake Agree</p>
            <button
              onClick={() => setMinimized(true)}
              style={styles.minimizeButton}
            >
              −
            </button>
          </div>
          <div style={styles.chatWindow}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  alignSelf:
                    message.user === currentAccount ? "flex-end" : "flex-start",
                  backgroundColor:
                    message.user === currentAccount ? "#daf7a6" : "#a6e3f7",
                }}
              >
                <strong>{message.user.slice(0, 6)}...</strong>: {message.text}
              </div>
            ))}
          </div>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a stake proposal..."
              style={styles.input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
            />
            <button onClick={handleSend} style={styles.button} disabled={!currentAccount}>
              Send
            </button>
          </div>
        </>
      )}
      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          style={styles.expandButton}
        >
          💬
        </button>
      )}
      <div
        style={styles.resizer}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    bottom: "10px",
    right: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  header: {
    padding: "8px",
    backgroundColor: "#f1f0f0",
    textAlign: "center",
    color: "#282c34",
    borderBottom: "1px solid #ccc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  minimizeButton: {
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#888",
  },
  expandButton: {
    width: "100%",
    height: "100%",
    border: "none",
    backgroundColor: "#d7e2d8",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
  chatWindow: {
    flex: 1,
    overflowY: "scroll",
    padding: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "15px",
    backgroundColor: "#f9f9f9",
  },
  message: {
    maxWidth: "70%",
    padding: "5px",
    borderRadius: "10px",
    color: "#333",
  },
  inputContainer: {
    display: "flex",
    borderTop: "1px solid #ccc",
    padding: "10px",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: "5px",
    fontSize: "13px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    marginLeft: "5px",
    padding: "5px 10px",
    fontSize: "10px",
    color: "#fff",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  resizer: {
    width: "10px",
    height: "10px",
    backgroundColor: "#ccc",
    position: "absolute",
    top: "0",
    left: "0",
    cursor: "nwse-resize",
  },
};

export default Chat;