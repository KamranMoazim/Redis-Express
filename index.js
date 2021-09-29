const express = require("express");
const redis = require("redis");
const util = require("util");
const axios = require("axios");
const { chdir } = require("process");

const PORT = 5000;
const redisUrl = "redis://127.0.0.1:6379";

const app = express();
const client = redis.createClient(redisUrl);

client.set = util.promisify(client.set);
client.get = util.promisify(client.get);

app.use(express.json());

app.post("/", async (req,res)=>{
    const { key, value } = req.body;
    const response = await client.set(key, value);
    res.json(response);
})

app.get("/", async (req,res)=>{
    const { key } = req.body;
    const response = await client.get(key);
    res.json(response);
})


app.get("/posts/:id", async (req,res)=>{
    const { id } = req.params;
    const cachedPost = await client.get(`post-${id}`);
    if (cachedPost) {
        return res.json(JSON.parse(cachedPost));
    }

    const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
    await client.set(`post-${id}`, JSON.stringify(response.data), "EX", 10); // here EX 10 means it will expire from cache after 10 seconds
    return res.json(response.data);
})


app.listen(PORT, ()=>{
    console.log(`Now Listening on port ${PORT}`)
})