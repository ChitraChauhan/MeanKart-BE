const mongoose = require('mongoose');

const specificationsSchema = new mongoose.Schema({
    brand: { type: String },
    model: { type: String },
    color: { type: String },
    size: { type: String },
    weight: { type: Number },
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    imageUrl: [{
        type: String,
    }],
    specifications: specificationsSchema,
    isActive: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });

// Index for better query performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
