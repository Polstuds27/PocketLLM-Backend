import express from "express";
import { WebSocketServer } from "ws";
import  Groq  from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const server = app.listen(PORT, ()=> {
    console.log("Server running on port", PORT);
});

const wss = new WebSocketServer({server});

wss.on("connection", (ws)=>{
    console.log("Client connected");

    ws.on("message", async (data) =>{
        const parsed = JSON.parse(data.toString());
        const { messages, model } = parsed;

        try {
            const response = await groq.chat.completions.create({
                model: model,
                messages: [
                    {role: "system", content: "you are a helpful assistant"},
                    ...messages
                ]
            });


            const reply = response.choices[0].message.content;

            ws.send(JSON.stringify({
                type: "response",
                message: reply
            }));


        } catch (err) {
             console.error("Groq error:", err.message, err.status);
            ws.send(JSON.stringify({
                type: "error",
                message: "LLM request failed"
            }));
        }
    });

    
    ws.on("close", ()=>{
        console.log("Client Disconnected");
    })
});