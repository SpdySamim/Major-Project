//env for cloudinary
if(process.env.NODE_ENV !="production"){  
    require('dotenv').config();
}
//express setup
const express=require("express");
const app=express();
const port=7070;
const path=require("path");
//routes
const userRouter=require("./routes/user.js")
const {isLoggedIn, isOwner, isReviewAuthor}=require("./middleware.js")
//controllers
const listingController=require("./controllers/listings.js")
const reviewController=require("./controllers/reviews.js")
//cloudinary
const{storage}=require("./cloudconfig.js")
//multer for uploading multipart form data
const multer  = require('multer')
const upload = multer({ storage })
//session
const session=require("express-session")
const MongoStore = require('connect-mongo');
//flash
const flash=require("connect-flash")
//method override
const methodOverride=require("method-override");
app.use(methodOverride("_method"));
//ejs mate
const ejsMate=require("ejs-mate");
app.engine("ejs",ejsMate);
//ejs setup
const ejs=require("ejs");
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
// app.set(express.static(path.join(__dirname,"views")))
const wrapAsync=require("./utils/wrapAsync.js")
const ExpressError=require("./utils/ExpressError.js")
//passport
const passport=require("passport")
const LocalStrategy=require("passport-local")
const User=require("./models/user.js")
//mongoose setup
 const mongoose=require("mongoose");
//  const Listing=require("./models/listing.js");
//  const Review=require("./models/reviews.js");
 const {listingSchema,reviewSchema}=require("./schema.js");
// const { truncate } = require("fs");
//  const mongo_url="mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;
 main().then(()=>{
     console.log("database connected successfully..");
 }).catch((err)=>{
     console.log(err);
 })
 async function main(){
    await mongoose.connect(dbUrl);
 };
//use session
const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.S,
    },
    touchAfter:24*3600,
});
store.on("error",()=>{
    console.log("Error in Mongo Session Store",err);
})
const sessionOptions={
    store,
    secret:process.env.S,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
};
app.use(session(sessionOptions));
app.use(flash());
//passport use
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//mw for flash
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser=req.user;
    next();
});
app.use("/",userRouter);
//all listings
app.get("/listings",wrapAsync(listingController.index));
//new route
app.get("/listings/new",isLoggedIn,listingController.renderNewForm);
app.get("/listings/:id",wrapAsync(listingController.showListing));
const validateListing=(req,res,next)=>{
    let{error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};
//post req for new listing
app.post(
    "/listings",isLoggedIn,
    upload.single('listings[image]'),
    validateListing,
    wrapAsync(listingController.createListing));
//edit route
app.get("/listings/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm));
//update route
app.put("/listings/:id",isLoggedIn,isOwner,upload.single('listings[image]'),validateListing,wrapAsync(listingController.updateListing));
//delete route
app.delete("/listings/:id/delete",isLoggedIn,isOwner,wrapAsync(listingController.deleteListing));
//search
app.get("/search",wrapAsync(listingController.searchResult));
// problem....
//reviews
const validateReview=(req,res,next)=>{
    let{error}=reviewSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};
app.post("/listings/:id/reviews",isLoggedIn,validateReview,wrapAsync(reviewController.createReview))
app.delete("/listings/:id/reviews/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.deleteReview))
app.get("/search",wrapAsync(listingController.searchResult));
// app.use("/",userRouter)
//error handling
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found"));
})
app.use((err,req,res,next)=>{
    let{statusCode=500,message="Somthing went wrong!"}=err;
    res.render("error.ejs",{err});
});
app.listen(port,()=>{
    console.log("server is running on port",port);
})