import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { getGame } from "./utils";
import { FaRegPaperPlane } from "react-icons/fa"; 

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentAccount, setAccount] = useState(null);
  const [chatSize, setChatSize] = useState({ width: 300, height: 300 });
  const [minimized, setMinimized] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [connected, setConnected] = useState(false);
  const chatWindowRef = useRef(null);
  const wsRef = useRef(null);
  const channelId = getGame();

  const suggestions = [
    "1 gwei",
    "5 gwei",
    "10 gwei",
    "50 gwei",
  ];

  const LOCAL_STORAGE_KEY = `chat_${channelId}`;

  const checkMetaMask = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } else {
      alert("Install Metamask to play Mastermind.");
    }
  };

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (err) {
        console.error("Connection failed:", err);
      }
    } else {
      alert("Install Metamask to play Mastermind.");
    }
  };

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
      });
    }
    checkMetaMask();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // WebSocket connection logic
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080"); // Adjust to your server URL
    wsRef.current = ws;

    ws.onopen = () => {
      console.debug("WebSocket connected");
      setConnected(true);

      // Join the specified channel
      ws.send(
        JSON.stringify({
          type: "connect",
          channelId: channelId,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.debug("Received message:", message);

      if (message.type === "message") {
        setMessages((prev) => [...prev, { user: "Other", text: message.text }]);
      } else if (message.type === "info") {
        console.debug("Info:", message.message);
      } else if (message.type === "error") {
        console.error("Error:", message.message);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.debug("WebSocket disconnected");
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [channelId]);

  const handleSend = (text = input) => {
    if (text.trim() === "" || !currentAccount || !connected) return;

    // Send the message to the WebSocket server
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        text,
      })
    );

    // Add the message to the local state
    setMessages((prev) => [...prev, { user: currentAccount, text }]);
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
      const deltaX = initialX - resizeEvent.clientX;
      const deltaY = initialY - resizeEvent.clientY;

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
            <p>Chat</p>
            <button
              onClick={() => setMinimized(true)}
              style={styles.minimizeButton}
            >
              −
            </button>
          </div>
          <div style={styles.chatWindow} ref={chatWindowRef}>
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
                <strong>{message.user === currentAccount ? "Me" : message.user}</strong>:{" "}
                {message.text}
              </div>
            ))}
          </div>
          <div style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                style={styles.suggestionButton}
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
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
            <button
              onClick={() => handleSend()}
              style={styles.button}
              disabled={!connected || !currentAccount}
            >
              <FaRegPaperPlane/>
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
  suggestionsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    padding: "5px",
    backgroundColor: "#f1f1f1",
    borderBottom: "1px solid #ccc",
  },
  suggestionButton: {
    padding: "5px 10px",
    backgroundColor: "#c9eae3",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
  },
};

export default Chat;