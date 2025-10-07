const mongoose = require('mongoose');

const specificationsSchema = new mongoose.Schema({
        brand: {type: String},
        model: {type: String},
        color: {type: String},
        size: {type: String},
        weight: {type: Number},
    },
);

const productSchema = new mongoose.Schema({
        name: {type: String, required: true, trim: true},
        description: {type: String, required: true, trim: true},
        price: {type: Number, required: true, min: 0},
        stock: {type: Number, required: true, min: 0},
        category: {type: String, required: true, trim: true},
        images: [{
            type: String,
            required: true
        }],
        specifications: specificationsSchema,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('AdminProduct', productSchema);
