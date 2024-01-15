
const Listing=require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const ExpressError=require("../utils/ExpressError");
const{listinsSchema}=require("../schema");
//home route
module.exports.index=async(req,res)=>{
    const allListings=await Listing.find({});
    res.render("./listings/index.ejs",{allListings});
}
//add new listing route
module.exports.renderNewForm=(req,res)=>{
    res.render("./listings/new.ejs");
}
//show route
module.exports.showListing=async(req,res)=>{
    let{id}=req.params;
    const listing=await Listing.findById(id)
        .populate({
            path: "reviews",
            populate:{
                path: "author",
            },
        })
        .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested doesn't exit!");
        res.redirect("/listings")
    }
    res.render("listings/show.ejs",{listing});
}
//create new route
module.exports.createListing=async(req,res,next)=>{
//mapbox code
    let response=await geocodingClient.forwardGeocode({
        query: req.body.listings.location,
        limit: 2,
    })
    .send();
    let url=req.file.path;
    let filename=req.file.filename;
    const newListing=new Listing(req.body.listings);
    newListing.owner=req.user._id;
    newListing.image={url,filename};
    newListing.geometry=response.body.features[0].geometry;
    let savedListings=await newListing.save();
    req.flash("success","Listing added successfully!")
    res.redirect("/listings");
}
//edit route
//1.form rendering
module.exports.renderEditForm=async (req,res)=>{
    let{id}=req.params;
    let listing=await Listing.findById(id); 
    if(!listing){
        req.flash("error","Listing you requested doesn't exit!");
        res.redirect("/listings")
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("./listings/edit.ejs",{listing,originalImageUrl});
}
//update route
module.exports.updateListing=async (req,res)=>{
    let{id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listings});
    if(typeof req.file !=="undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
    }
    req.flash("success","Listing Updated!")
    res.redirect(`/listings`);
}
//delete route
module.exports.deleteListing=async(req,res)=>{
    let{id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing deleted successfully!")
    res.redirect("/listings");
}
//search Route
module.exports.searchResult=async(req,res)=>{
    let{search}=req.query;
    let result=await Listing.find({$or:[{country: search},{title:search}]});
    if(result.length==0){
        req.flash("error",`Sorry! No places are here form ${search}`);
        res.redirect("/listings");
    }else{
        res.render("searchResult.ejs",{result});
    }
}