const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, unique: true },
  order:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItemIndex: { type: Number, required: true }, // which item in order.items[]
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, enum: ['RETURN', 'EXCHANGE'], required: true },

  // Customer-provided info
  reason:       { type: String, required: true },
  customerNote: { type: String, maxlength: 1000 },
  images:       [{ url: String, publicId: String }],

  // Exchange only
  requestedVariant: {
    color: String,
    size:  String,
  },

  // Snapshot of ordered item (for display without populating order)
  itemSnapshot: {
    productId:   mongoose.Schema.Types.ObjectId,
    productName: String,
    image:       String,
    color:       String,
    size:        String,
    quantity:    Number,
    price:       Number,
  },

  status: {
    type: String,
    enum: ['PENDING','APPROVED','PICKUP_SCHEDULED','PICKED_UP','RECEIVED','INSPECTED','COMPLETED','REJECTED','CANCELLED'],
    default: 'PENDING',
  },
  statusHistory: [{
    status:    String,
    timestamp: { type: Date, default: Date.now },
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  adminNote:    { type: String },
  refundStatus: { type: String, enum: ['NONE','PENDING','PROCESSED'], default: 'NONE' },
  refundAmount: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate request number
returnRequestSchema.pre('save', function(next) {
  if (!this.requestNumber) {
    const prefix = this.type === 'RETURN' ? 'RET' : 'EXC';
    this.requestNumber = prefix + Date.now().toString().slice(-7) + Math.random().toString(36).slice(-3).toUpperCase();
  }
  next();
});

returnRequestSchema.index({ user: 1, createdAt: -1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });
returnRequestSchema.index({ order: 1 });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
