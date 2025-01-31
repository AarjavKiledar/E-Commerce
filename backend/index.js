require('dotenv').config(); // Fix dotenv configuration
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Product Schema for creating products
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

// Middleware
app.use(express.json());
app.use(cors());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error: ', err));

// Cloudinary Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    format: (req, file) => path.extname(file.originalname).substring(1),
    public_id: (req, file) => `${file.fieldname}_${Date.now()}`,
  },
});

const upload = multer({ storage: storage });

// Routes
app.get("/", (req, res) => {
  res.send("Express App is running");
});

// Upload Endpoint
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, error: "No file uploaded" });
  }
  res.json({
    success: 1,
    image_url: req.file.path,
  });
});

// Add Product Endpoint
app.post('/addproduct', async (req, res) => {
  let products = await Product.find({});
  let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  await product.save();
  console.log("Product is saved successfully");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Remove Product Endpoint
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Product is deleted successfully");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Get All Products Endpoint
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  console.log("All products are fetched successfully");
  res.send(products);
});

// Schema for creating users
const Users = mongoose.model("Users", {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now },
});

// User Registration Endpoint
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
    user: { id: user.id },
  };
  const token = jwt.sign(data, 'secret_ecom');
  res.json({ success: true, token });
});

// User Login Endpoint
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = { user: { id: user.id } };
      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Invalid Password" });
    }
  } else {
    res.json({ success: false, errors: "User not found" });
  }
});

// Middleware to fetch user from JWT token
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, 'secret_ecom');
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Add Product to Cart
app.post('/addtocart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// Remove Product from Cart
app.post('/removefromcart', fetchUser, async (req, res) => {
  try {
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
      { new: true }
    );

    res.json({ message: "Removed", cart: updatedUser.cartData });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Cart Data
app.post('/getcart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

// Error Handling for missing environment variables (add to all routes as needed)
app.listen(process.env.PORT || 4000, (error) => {
  if (!error) {
    console.log("Server is running on port: " + (process.env.PORT || 4000));
  } else {
    console.log("Error found: " + error);
  }
});
