import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { getGame } from "./utils";
import { FaRegPaperPlane } from "react-icons/fa"; 
import "./App.css";

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
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages.filter(
      (x) => x.user !== "System"
    )));
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
    const ws = new WebSocket("ws://localhost:8181");
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
      } else if (message.type === "service") {
        console.debug("Service:", message.message);
        setMessages((prev) => [...prev, { user: "System", text: message.message }]);
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
      className="chat-container"
      style={{
        width: minimized ? "50px" : `${chatSize.width}px`,
        height: minimized ? "50px" : `${chatSize.height}px`,
      }}
    >
      {!minimized && (
        <>
          <div className="chat-header">
            <p>Chat</p>
            <button
              onClick={() => setMinimized(true)}
              className="chat-minimizeButton"
            >
              −
            </button>
          </div>
          <div className="chat-window" ref={chatWindowRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className="chat-message"
                style={{
                  alignSelf:
                    message.user === currentAccount ? "flex-end" : (
                      message.user === "System" ? "center" : "flex-start"),
                  backgroundColor:
                    message.user === currentAccount ? "#daf7a6" :  (
                      message.user === "System" ? "transparent" : "#a6e3f7"),
                  fontStyle : message.user === "System" ? "italic" : ""
                }}
              >
                <strong>{message.user === currentAccount ? "Me" : (
                  message.user === "System" ? "" : message.user)}</strong>{" "}
                {message.text}
              </div>
            ))}
          </div>
          <div className="chat-suggestionsContainer">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="chat-suggestionButton"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="chat-inputContainer">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a stake proposal..."
              className="chat-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
            />
            <button
              onClick={() => handleSend()}
              className="chat-button"
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
          className="chat-expandButton"
        >
          💬
        </button>
      )}
      <div
        className="chat-resizer"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};

export default Chat;