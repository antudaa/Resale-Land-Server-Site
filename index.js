const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();


const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send("Resale Land Is Running");
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p4iytrv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {

        const categoryCollection = client.db('ResaleLand').collection('categoryCollection');
        const userCollection = client.db('ResaleLand').collection('userCollection');
        const productCollection = client.db('ResaleLand').collection('productsCollection');


        app.get('/category', async (req, res) => {
            const query = {};
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        });


        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            const result = await userCollection.insertOne(userInfo);
            res.send(result);
        });

        app.get('/products', async (req, res) => {
            const query = {};
            const result = await productCollection.find(query).toArray();
            res.send(result);
        });


        app.get('/category/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = {
                categoryId: ('id')
            };
            const product = await productCollection.find(query).toArray();
            res.send(product);
        });

    }
    finally {

    }
}

run().catch(console.log);




app.listen(port, () => console.log(`Server Running on Port ${port}`));