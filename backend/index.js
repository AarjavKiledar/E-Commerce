const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { log } = require("console");
const { type } = require("os");

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect("mongodb+srv://aarjavkiledar:Aarjav456@cluster0.14p3r.mongodb.net/e-commerce");

// API Creation
app.get("/", (req, res) => {
    res.send("Express App is running");
});

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images', // You might want to change this to a cloud solution or ensure local storage is allowed
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

// Creating Upload Endpoint
app.use('/images', express.static(path.join(__dirname, 'upload', 'images'))); // Corrected path

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `https://e-commerce-js8k.onrender.com/images/${req.file.filename}` // Corrected URL with deployed URL
    });
});

// Schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
});

// Add product endpoint
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    } else {
        id = 1;
    }

    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });

    console.log(product);
    await product.save();
    console.log("Product is saved successfully");
    res.json({
        success: true,
        name: req.body.name,
    });
});

// Creating API for deleting products
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Product is deleted successfully");
    res.json({
        success: true,
        name: req.body.name,
    });
});

// API to get all products
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All products are fetched successfully");
    res.send(products);
});

// Schema for creating users
const Users = mongoose.model("Users", {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

// User Registration endpoint
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Email already exists" });
    }

    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }

    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save();

    const data = {
        user: {
            id: user.id,
        }
    };
    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
});

// User Login endpoint
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id,
                }
            };
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Invalid Password" });
        }
    } else {
        res.json({ success: false, errors: "User not found" });
    }
});

// Fetch user middleware
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        req.status(401).send({ errors: "Please authenticate using valid token" });
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({ errors: "Please authenticate using valid token" });
        }
    }
};

// Add to cart endpoint
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("added", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added");
});

// Remove from cart endpoint
app.post('/removefromcart', fetchUser, async (req, res) => {
    try {
        console.log("Removed item:", req.body.itemId);
        let userData = await Users.findOne({ _id: req.user.id });

        if (!userData) {
            return res.status(404).json({ error: "User not found" });
        }

        if (userData.cartData[req.body.itemId] > 0) {
            userData.cartData[req.body.itemId] -= 1;
        }

        // Save updated cart and return new data
        const updatedUser = await Users.findOneAndUpdate(
            { _id: req.user.id },
            { cartData: userData.cartData },
            { new: true } // Returns updated user data
        );

        res.json({ message: "Removed", cart: updatedUser.cartData }); // Send updated cart
    } catch (error) {
        console.error("Error removing item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get cart data endpoint
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("GetCart");
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
});

// Start the server
app.listen(port, (error) => {
    if (!error) {
        console.log("Server is running on port: " + port);
    } else {
        console.log("Error found: " + error);
    }
});
