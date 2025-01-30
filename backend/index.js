const port=4000;
const express = require("express");
const app=express();
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken")
const multer=require("multer");
const path=require("path");
const cors=require("cors");
const { log } = require( "console" );
const { type } = require( "os" );

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect("mongodb+srv://aarjavkiledar:Aarjav456@cluster0.14p3r.mongodb.net/e-commerce");
//API Creation

app.get("/",(req,res)=>{
    res.send("Express App is running");
})

//Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
// here we are renaming the file name with the field name and date.now() and the original name of the file


const upload = multer({storage:storage})

//Creating Upload EndPoint
app.use('/images',express.static('upload/images'));

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})
//if image is uploaded successfully then it will return the success message and the path of the image

//Schema for creating products
const Product=mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },

    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },
})

app.post('/addproduct',async(req,res)=>{
    let products=await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product=new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Product is saved successfully");
    res.json({
        success:true,
        name:req.body.name,
    })
})


//Creating API for deleting products

app.post('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Product is deleted successfully");
    res.json({
        success:true,
        name:req.body.name,
    })
})
    

//Creating API for getting all the products
app.get('/allproducts',async(req,res)=>{
    let products=await Product.find({});
    console.log("All products are fetched successfully");
    res.send(products);
})

//Schema for creating users
const Users=mongoose.model("Users",{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    },
})

// Creating EndPoint for user registration
app.post('/signup',async(req,res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"Email already exists"});
    }
    let cart={};
    for(let i=0;i< 300;i++){
        cart[i]=0;
    }
    const user=new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
    await user.save();

    const data={
        user:{
            id:user.id,
        }
    }
    const token=jwt.sign(data,'secret_ecom')
    res.json({success:true,token})
})

// Creating endpoint for the user login
app.post('/login',async(req,res)=>{
    let user=await Users.findOne({email:req.body.email});
    if(user){
        const passComapare=req.body.password===user.password;
        if(passComapare){
            const data={
                user:{
                    id:user.id,
                }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Invalid Password"});
        }
    }
    else{
        res.json({success:false,errors:"User not found"});
    }
})

//creating end point for new collection data
app.get('/newcollections',async(req,res)=>{
    let products=await Product.find({});
    let newcollection=products.slice(1).slice(-8);
    console.log("New Collection is fetched successfully");
    res.send(newcollection);
})

//creating end point for popular in women section
app.get('/popularinwomen',async(req,res)=>{
    let products=await Product.find({category:"women"});
    let popular_in_women=products.slice(0,4);
    console.log("Popualr in women fetched");
    res.send(popular_in_women);
})

//Creating a middleware to fetch user
    const fetchUser=async(req,res,next)=>{
        const token=req.header('auth-token');
        if(!token){
            req.status(401).send({errors:"Please authenticate using valid token"});
        }
        else{
            try{
                const data=jwt.verify(token,'secret_ecom');
                req.user=data.user;
                next();
            }catch(error){
                res.status(401).send({errors:"Please authenticate using valid token"});
                res.send("Added")
            }
        }
    }

//creating end points for adding products in cart data
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("added",req.body.itemId);
    let userData=await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId]+=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added");
})

//Creating End Points to remove product from cart data
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

// creating end point to get cart data
app.post('/getcart',fetchUser,async(req,res)=>{
    console.log("GetCart");
    let userData=await Users.findOne({_id:req.user.id});
    res.json(userData.cartData); 
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server is running on port: "+port);
    }
    else{
        console.log("Error found: "+error);
    }
})