const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({user: req.user._id})
            .populate('items.product', 'name price imageUrl');

        if (!cart) {
            return res.status(200).json({items: [], total: 0});
        }

        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

exports.addToCart = async (req, res) => {
    try {
        const {productId, quantity = 1} = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({message: 'ProductModel not found'});
        }

        let cart = await Cart.findOne({user: req.user._id});

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = parseInt(quantity);
        } else {
            cart.items.push({
                product: productId,
                quantity: parseInt(quantity),
                price: product.price,
                name: product.name,
                image: product.imageUrl[0]
            });
        }

        await cart.save();
        const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');

        res.status(201).json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const {quantity} = req.body;
        const {itemId} = req.params;

        if (quantity < 1) {
            return res.status(400).json({message: 'Quantity must be at least 1'});
        }

        const cart = await Cart.findOne({user: req.user._id});
        if (!cart) {
            return res.status(404).json({message: 'Cart not found'});
        }

        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({message: 'Item not found in cart'});
        }

        cart.items[itemIndex].quantity = parseInt(quantity);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
        res.json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const {itemId} = req.params;

        const cart = await Cart.findOne({user: req.user._id});
        if (!cart) {
            return res.status(404).json({message: 'Cart not found'});
        }

        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.status(404).json({message: 'Item not found in cart'});
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price imageUrl');
        res.json(updatedCart);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({user: req.user._id});

        if (!cart) {
            return res.status(200).json({message: 'Cart is already empty'});
        }

        cart.items = [];
        await cart.save();

        res.json({message: 'Cart cleared successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};
