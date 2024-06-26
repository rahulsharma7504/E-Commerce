const dotenv=require('dotenv').config();
const cloudinary=require('cloudinary').v2;
const slugify=require('slugify');
const ProductModel = require('../Model/ProductModel');
const Razorpay = require('razorpay');
const BookingModel=require('../Model/Booking');


const CreateProduct=async(req,res)=>{
    const { name, price, description,categoryId, quantity ,shipping} = req.body;
    const image = req.file.path;
    const slug = slugify(String(name));
    
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret:process.env.API_SECRET,
        secure: true,
    });
    
    try {
        const findexistProduct = await ProductModel.findOne({ name: name });
        if (findexistProduct) {
            return res.status(400).json({ error: "Product Already Exist" });
        }
        
        const uploadedImage = await cloudinary.uploader.upload(image);
    
        const product = new ProductModel({
            name: slug,
            price: price, 
            description: description,
            category: categoryId,
            quantity: quantity,
            image: uploadedImage.secure_url, // Accessing the secure URL of the uploaded image
            shipping: true
        });
    
        await product.save();
        
        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
    
}

const CreateProductget=(req,res)=>{ 
    res.sendFile(__dirname +'/index.html');

}
 

const AllProduct=async(req,res)=>{
    try {
        const allProduct = await ProductModel.find().limit(3)
        console.log(allProduct);
        res.status(200).json({ message: "All Product", Product: allProduct,totel:allProduct.length });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ error: "Internal Server Error" });
}
}

const AllManage=async(req,res)=>{
    try {
        const allProduct = await ProductModel.find()
        console.log(allProduct);
        res.status(200).json({ message: "All Product", Product: allProduct,totel:allProduct.length });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ error: "Internal Server Error" });
}
}
const SingleProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const singleProduct = await ProductModel.findOne({_id:id})

        // If no product is found, return a 404 Not Found response
        if (!singleProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Product found, send it in the response
        res.status(200).json({ message: "Success", product: singleProduct });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const UpdateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, category, quantity, shipping } = req.body;
        let image;

        // Check if req.file exists and set the image path accordingly
        if (req.file) {
            image = req.file.path;
            const uploadedImage = await cloudinary.uploader.upload(image);
            image = uploadedImage.secure_url;
        } else {
            // If no new image is uploaded, use the existing image URL
            image = req.body.image;
        }

        const slug = slugify(String(name)); 

        const updateProduct = await ProductModel.findOneAndUpdate(
            { _id: id }, // Filter criteria
            { $set: { name: slug, price: price, description: description, category: category, quantity: quantity, image: image, shipping: shipping } }, // Update document
            { new: true } // To return the updated document
        );

        // Product found, send it in the response
        res.status(200).json({ message: "Update Product Success", product: updateProduct });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



const DeleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const singleProduct = await ProductModel.findByIdAndDelete({_id:id})
        // If no product is found, return a 404 Not Found response
       

        // Product found, send it in the response
        res.status(200).json({ message: "Delete Product Success", product: singleProduct });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const filterProduct = async (req, res) => {
    try {
        const { checked, radio } = req.body;
        const filterConditions = {};

        if (checked.length > 0) {
            filterConditions.category = { $in: checked };
        }

        if (radio.length > 0) {
            const [minPrice, maxPrice] = radio[0].split(',');
            filterConditions.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
        }

        const filteredProducts = await ProductModel.find(filterConditions);
        res.json(filteredProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


const Pagination = async (req, res) => {
    try {
        let page = req.query.page || 1; // Default to page 1 if not specified
        const pageSize = 3; // Number of products per page
        const skip = (page - 1) * pageSize;
    
        const products = await ProductModel.find()
          .skip(skip)
          .limit(pageSize);
    
        res.status(200).json({ data: products, message: "Data has been fetched successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error in fetching the data." })
    }
}


const Search = async (req, res) => {
    try {
        const {search}=req.params;
        const searchProduct = await ProductModel.find({
            $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ]
        })
        res.status(200).json({ data: searchProduct, message: "Data has been fetched successfully" });
      
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error in fetching the data." })
    }
}

const SimilarProduct = async (req, res) => {
    try {
      const { pid, cid } = req.params;
      const product = await ProductModel.findById(pid);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      // Find similar products based on the category ID
      const similarProducts = await ProductModel.find({
        _id: { $ne: pid }, // Exclude the current product
        category: cid, // Filter by category
      });
  
      res.status(200).json({ similarProducts });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error in fetching the data." });
    }
  };


  
const CategoryProducts = async (req, res) => {
    try {
        const {id}=req.params;
        const categoryProducts = await ProductModel.find({category:id})
        res.status(200).json({ data: categoryProducts, message: "Data has been fetched successfully" });
        
       
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error in fetching the data." })
    }
}

 
const razorpay = new Razorpay({
    key_id:process.env.RezorPayKey_id,
    key_secret: process.env.RezorPaySecret_id
  });



// Order Product
const OrderDetails = async (req, res) => {
    try {
        const { Amount, Currency, UserID, Products, totalPrice, Status } = req.body;

        // Map products array
        const mappedProducts = Products.map(product => ({
            ProductName: product.name,
            ProductID: product._id
        }));

        // Create Razorpay order
        const options = {
            amount: Amount * 100, // Convert amount to the smallest currency unit
            currency: Currency.toUpperCase(), // Ensure currency code is uppercase
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // If order creation is successful, proceed to create booking
        if (order) {
            const newBooking = new BookingModel({
                Products: mappedProducts,
                UserID: UserID,
                Amount: totalPrice,
                Currency: Currency,
                Status: 'Booked', // Update status to 'Booked'
                TransactionID: order.id // Use Razorpay order ID as TransactionID
            });

            const booking = await newBooking.save();

            // Send success response with order data and booking data
            res.status(201).json({ order, message: "Order created successfully", booking });
        } else {
            // If order creation fails, send error response
            throw new Error('Failed to create Razorpay order');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error in creating the order." });
    }
};


module.exports={
    CreateProduct,
    CreateProductget,
    AllProduct,
    AllManage,
    SingleProduct,
    DeleteProduct,
    UpdateProduct,
    filterProduct,
    Pagination,
    Search,
    SimilarProduct,
    CategoryProducts,
    OrderDetails
}
 // res.status(200).json({ data: booking, message: "Data has been fetched successfully" });
  
    // //  