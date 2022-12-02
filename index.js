const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');



const app = express();

// Middle Wares
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send("Resale Land Is Running");
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p4iytrv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// Verify JWT
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send("Unauthorized Access");
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send("Forbidden Access.");
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {

    try {

        // Collections
        const categoryCollection = client.db('ResaleLand').collection('categoryCollection');
        const userCollection = client.db('ResaleLand').collection('userCollection');
        const productCollection = client.db('ResaleLand').collection('productsCollection');
        const bookMeetingCollection = client.db('ResaleLand').collection('bookMeetingCollection');
        const reportedItemsCollection = client.db('ResaleLand').collection('reportedItemsCollection');
        const advertiseProductCollection = client.db('ResaleLand').collection('advertiseProductCollection');


        app.get('/category', async (req, res) => {
            const query = {};
            const result = await categoryCollection.find(query).toArray();
            res.send(result);
        });


        app.get('/products', async (req, res) => {
            const query = {};
            const result = await productCollection.find(query).toArray();
            res.send(result);
        });


        // Add New Product 
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        })


        app.get('/category/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = {
                category: id
            };
            const product = await productCollection.find(query).toArray();
            res.send(product);
        });


        // To get Products via Email Address.
        app.get('/products/:email', async (req, res) => {
            const email = req.params.email;
            const query = {
                email: email
            }
            const result = await productCollection.find(query).toArray();
            res.send(result);
        });


        app.put('/users', async (req, res) => {
            const email = req.query.email;
            const name = req.query.name;
            console.log(email, name);
            const filter = { email: (email) };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    name: name,
                    role: 'buyer',
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc, option);
            res.send(result);
        });


        //JWT Token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN)
                return res.send({ accessToken: token });
            }
            console.log(user);
            res.status(403).send({ "Token": "UnAuthorized Access." });
        });




        // Getting All Sellers
        app.get('/users/sellers', async (req, res) => {
            // const role = req.query.role;
            // const decodedEmail = req.decoded.email;
            // if(email != decodedEmail){
            //     res.status(403).send("Forbidden Access");
            // }

            const query = { role: 'seller' };
            const seller = await userCollection.find(query).toArray();
            res.send(seller);

        });



        // Getting All Buyers
        app.get('/users/buyers', verifyJWT, async (req, res) => {
            const role = req.query.role;
            const query = { role: 'buyer' };
            const seller = await userCollection.find(query).toArray();
            res.send(seller);

        });


        app.post('/buyerInfo', async (req, res) => {
            const buyerInfo = req.body;
            const result = await bookMeetingCollection.insertOne(buyerInfo);
            res.send(result);
        });


        // Getting User 
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        });


        // Posting Users 
        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            const result = await userCollection.insertOne(userInfo);
            res.send(result);
        });


        // API For Update the role to Admin
        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            // const email = req.params.email;
            // const name = req.params.name;
            const filter = {
                _id: id
            }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin',
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        // Posting Reported Items
        app.post('/reportedItems', async (req, res) => {
            const report = req.body;
            const result = await reportedItemsCollection.insertOne(report);
            res.send(result);
        });


        //Getting Reported Items.
        app.get('/reportedItems', async (req, res) => {
            const query = {};
            const result = await reportedItemsCollection.find(query).toArray();
            res.send(result);
        });


        // Route to get admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });


        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' });
        });


        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        });



        // Delete User
        app.delete('/users/sellers/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        app.get('/myOrders/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { buyerEmail: email };
            const result = await bookMeetingCollection.find(query).toArray();
            res.send(result);
        });


        app.get('/sellerProducts/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };
            const result = await productCollection.find(query).toArray();
            res.send(result);
        });


        app.get('/myBuyers/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { sellerEmail: email };
            const result = await bookMeetingCollection.find(query).toArray();
            res.send(result);
        });


        // Verify Seller
        app.put('/users/update/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: Objectid(id)
            }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'verified',
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        app.post('/advertiseProduct', async (req, res) => {
            const product = req.body;
            const result = await advertiseProductCollection.insertOne(product);
            res.send(result);
        });


        app.get('/advertiseProduct', async (req, res) => {
            const product = {};
            const result = await advertiseProductCollection.find(product).toArray();
            res.send(result);
        });

    }
    finally {

    }
}

run().catch(console.log);




app.listen(port, () => console.log(`Server Running on Port ${port}`));