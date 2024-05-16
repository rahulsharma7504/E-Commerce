const mongoose=require('mongoose');

const CategorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    slug:{
        type:String,
        unique:true,
        lowercase:true,
        trim:true,
    }
})

const Category = mongoose.model('Category',CategorySchema);

module.exports=Category;