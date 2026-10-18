import mongoose from 'mongoose';

const merchantMappingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Normalized lowercase merchant name for matching
    merchantName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // Original casing as typed/detected
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    merchantType: {
      type: String,
      enum: ['Person', 'Business'],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Unique mapping per user+merchant
merchantMappingSchema.index({ userId: 1, merchantName: 1 }, { unique: true });

const MerchantMapping = mongoose.model('MerchantMapping', merchantMappingSchema);
export default MerchantMapping;
