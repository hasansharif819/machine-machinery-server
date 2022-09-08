const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5oljn5y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//json web token
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('machine').collection('products');
        const cartCollection = client.db('machine').collection('carts');
        const orderCollection = client.db('machine').collection('orders');
        const userCollection = client.db('machine').collection('users');
        const reviewCollection = client.db('machine').collection('reviews');
        const paymentCollection = client.db('machine').collection('payments');
        const messageCollection = client.db('machine').collection('messages');
        const blogCollection = client.db('machine').collection('blogs');
        const commentCollection = client.db('machine').collection('comments');

        app.get('/product', async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result);
        });

        //user meaasage
        app.post('/message', async (req, res) => {
            const item = req.body;
            const query = { email: item.email, message: item.message, contact: item.contact, img: item.image };
            const exists = await messageCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, item: exists })
            }
            else {
                const result = await messageCollection.insertOne(item);
                res.send({ success: true, result });
            }
        });

        //blogs
        app.get('/blogs', async (req, res) => {
            const blogs = await blogCollection.find().toArray();
            res.send(blogs)
        });

        //post or upload new blog
        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const query = { email: blog.email, name: blog.name, des: blog.des, docs: blog.docs, img: blog.image };
            const exists = await blogCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, blog: exists })
            }
            else {
                const result = await blogCollection.insertOne(blog);
                res.send({ success: true, result });
            }
        });
        //comment post
        app.post('/comment', async (req, res) => {
            const comment = req.body;
            // const query = { comment: comment.comment, email: comment.email, name: comment.name, blogId: comment.blogId };
            const result = await commentCollection.insertOne(comment);
            return res.send({ success: true, result });
        });

        //get comment
        app.get('/comment/:blogId', async (req, res) => {
            const blogId = req.params.blogId;
            const query = { blogId: blogId };
            const comment = await commentCollection.find(query).toArray();
            res.send(comment);
        });
        //get user message
        app.get('/message', async (req, res) => {
            const message = await messageCollection.find().toArray();
            res.send(message);
        })

        //post or upload new product
        app.post('/product', async (req, res) => {
            const item = req.body;
            const query = { email: item.email, name: item.name, price: item.price, quantity: item.quantity, description: item.description, img: item.image };
            const exists = await productCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, item: exists })
            }
            else {
                const result = await productCollection.insertOne(item);
                res.send({ success: true, result });
            }
        });

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { '_id': ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result);
        });

        app.post('/cart', async (req, res) => {
            const cart = req.body;
            const query = { name: cart.name, email: cart.email, pQuantity: cart.pQuantity, cartID: cart.cartID };
            const exists = await cartCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, cart: exists });
            }
            else {
                const result = await cartCollection.insertOne(cart);
                res.send({ success: true, result });
            }
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const query = { name: order.name, email: order.email, pQuantity: order.pQuantity, orderID: order.orderID };
            const result = await orderCollection.insertOne(order);
            res.send({ success: true, result });

        });
        //all orders
        app.get('/order', async (req, res) => {
            const result = await orderCollection.find().toArray();
            res.send(result);
        });

        // cancel order by admin 
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });
        //my cart using email query
        app.get('/mycart', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        })

        //my orders using email query
        app.get('/myorder', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        });

        // paymentID query for targeted order
        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { '_id': ObjectId(id) };
            const result = await orderCollection.findOne(query);
            res.send(result);
        });

        //user Review
        app.post('/review', async (req, res) => {
            const item = req.body;
            const query = { name: item.name, email: item.email, review: item.review, ratings: item.ratings };
            const exists = await reviewCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, item: exists })
            }
            else {
                const result = await reviewCollection.insertOne(item);
                res.send({ success: true, result });
            }
        });

        app.get('/review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })

        // user section 
        //login user data collect
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ result, token });
        });

        //get all users
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        //get user for profile updating
        app.get('/profile', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        });

        //update profile by one
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        //Make an Admin temporary or first admin 
        // app.put('/user/admin/:email', async(req, res) => {
        //     const email = req.params.email;
        //     const filter = {email: email};
        //     const updateDoc = {
        //         $set: {role: 'admin'},
        //     };
        //     const result = await userCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // });

        //An Admin make another admin without admin no one can do this
        app.put('/user/:admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const initiator = req.decoded.email;
            const initiatorAccount = await userCollection.findOne({ email: initiator });
            if (initiatorAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'Forbidden access' });
            }
        });

        //get an admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })
        //delete user
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        //stripe 
        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.total;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({ clientSecret: paymentIntent.client_secret })
        });

        //After payment set payment collection and updated
        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transaction: payment.transactionId
                },
            };
            const result = await paymentCollection.insertOne(payment);
            const order = await orderCollection.updateOne(filter, updateDoc);
            res.send(updateDoc);
        });

        //shipping 
        app.put('/payments/:id', async (req, res) => {
            // const id = req.params.id;
            const id = req.body.payment;
            const filter = { id: id };
            const updateDoc = {
                $set: { role: 'Shipping' },
            };
            const result = await paymentCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
    }
    finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Tools')
});
app.listen(port, () => {
    console.log(`Hello Tools ${port}`);
});