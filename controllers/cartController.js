const Cart = require("../models/cartModel");

const getCartByUserAndPlace = async (req, res) => {
    try {
        const { userId, placeId } = req.params; 

        const cart = await Cart.findOne(
            { userId, "stores.placeId": placeId }, 
            { "stores.$": 1 } 
        );

        if (!cart) {
            return res.status(404).json({ message: "No cart found for the given userId and placeId" });
        }

        res.status(200).json(cart.stores[0]); 
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: "An error occurred while fetching the cart" });
    }
};

const addCart = async (req, res) => {
  try {
      const {
        userId,
        placeId,
        placeName,
        productId,
        productName,
        price,
        quantity,
      } = req.body;
  
      let cart = await Cart.findOne({ userId });

      if (!cart) {
        cart = new Cart({
          userId,
          stores: [
            {
              placeId,
              placeName,
              items: [{ productId, productName, price, quantity }],
              total: price * quantity,
            },
          ],
        });
      }else {
        const storeIndex = cart.stores.findIndex((store) => store.placeId === placeId);
        if (storeIndex === -1) {
            cart.stores.push({
              placeId,
              placeName,
              items: [{ productId, productName, price, quantity }],
              total: price * quantity,
            });
          } else {
            const items = cart.stores[storeIndex].items;
            const itemIndex = items.findIndex((item) => item.productId === productId);
    
            if (itemIndex === -1) {
              items.push({ productId, productName, price, quantity });
            } else {
              items[itemIndex].quantity = quantity;
            }
    
            cart.stores[storeIndex].total = items.reduce(
              (total, item) => total + item.price * item.quantity,
              0
            );
          }
    }

    await cart.save();

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "An error occurred while updating the cart" });      
}
}
module.exports = {
    getCartByUserAndPlace,
    addCart,
  };