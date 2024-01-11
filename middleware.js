const Listing = require("./models/listing");
const Review = require("./models/reviews");


module.exports.isLoggedIn=(req,res,next)=>{
    // console.log(req.path,"..",req.originalUrl)
    if(!req.isAuthenticated()){
        //redirect url save
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You need to logged in first!")
        res.redirect("/login")
    }else{
        next();
    }
};
module.exports.saveRedirecturl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
    
}
module.exports.isOwner=async(req,res,next)=>{
    let{id}=req.params;
    let listing=await Listing.findById(id);
    if(!listing.owner.equals(res.locals.currUser._id)){
        req.flash("error","You don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }
    next();
}
module.exports.isReviewAuthor=async(req,res,next)=>{
    let{id,reviewId}=req.params;
    let review=await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error","You don't have permission to delete.");
        return res.redirect(`/listings/${id}`);
    }
    next();
}