const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        // unique: true,
    },
    stores: [
        {
        placeId: {
            type: String,
            required: true,
        },
        placeName: {
            type: String,
            required: true,
        },
        items: [
            {
                productId: { type: String, required: true },
                productName: { type: String, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true }
            }
        ],
        total: {
            type: Number, default: 0
        }
    }
],
    
})

module.exports = mongoose.model("Cart", cartSchema);