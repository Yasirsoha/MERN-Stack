require('dotenv').config()
const express=require("express");
const bcrypt=require("bcrypt");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const async = require("hbs/lib/async");
const app=express();
require("./MongoDB/RestfulApi/Connection");
const port=process.env.Port ||8000;


const schemaPlaylist =new mongoose.Schema({
  email: {
      type: String,
      required: true,
      unique: true
  },
  password: {
    type: String,
    required: true
  },
  tokens:[{
    token:{
      type: String,
      required: true
    }
  }
  ]
 })
schemaPlaylist.methods.generateWebToken=async function(){
  try{
const token=await jwt.sign({_id:this._id.toString()},process.env.SECRET_KEY);
this.tokens=this.tokens.concat({token:token});
await this.save();
return token;

  }catch(err){
console.log(err);
  }
}
 
 schemaPlaylist.pre("save",async function(next){  //You can not use fat arrow or anynomous function
  // const hashPassword=await bcrypt.hash(password,10);
  if(this.isModified("password")){
    console.log(this.password);
  this.password=await bcrypt.hash(this.password,10);
  console.log(this.password);
  //return next();
  }
   next();
   })
 const Playlist=new mongoose.model("Login",schemaPlaylist);

app.use(express.urlencoded({extended: false}));
app.set("view engine","hbs");
app.post("/index",async(req,res)=>{
 // console.log(req.body.email);
  try{
    
  

    const resPlaylist=new Playlist({
        email:req.body.email,
        password:req.body.pass,
       
    })
  const token=await resPlaylist.generateWebToken();
  console.log(token);
  res.cookie("jwt",token,{
    expires: new Date(Date.now()+30000),  //if you will not add expire date then on refresh page cookie will be deleted
    httpOnly: true,   //client cannot use this cookiew
    // secure: true    //only work with https secure connection
  });
 const data=await resPlaylist.save();
 console.log(data);
}catch(err){
    console.log(err);
}
})
app.get("/index",(req,res)=>{
  res.render("index");
})



app.get("/login",(req,res)=>{
  res.render("home");
})
app.post("/login",async(req,res)=>{
 try{
  const email=req.body.emailhome;
  const password=req.body.passhome;
  const data=await Playlist.findOne({email: email});
   const bcryptPass=await bcrypt.compare(password,data.password);
   const token=await data.generateWebToken();
   console.log(token);
   res.cookie("jwt",token,{
     expires: new Date(Date.now()+30000),  //if you will not add expire date then on refresh page cookie will be deleted
     httpOnly: true,   //client cannot use this cookiew
     // secure: true    //only work with https secure connection
   });
  
  if(bcryptPass){
res.render("homepage")
  }else{
res.send("invalid login details");
  }
  
 }catch(err){
res.status(400).send("invalid login details");
 }
})




app.get("/",(req,res)=>{
  res.render("home");
})

app.listen(port,()=>{
  console.log(`listening at the port ${port}`);
})