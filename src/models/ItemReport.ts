import mongoose, { Schema, model, models } from "mongoose";

export interface IItemReport {
  _id?: string;
  itemId: mongoose.Types.ObjectId;
  reporterEmail: string; // The person reporting the issue
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

const ItemReportSchema = new Schema<IItemReport>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    reporterEmail: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String, required: true, maxlength: 1000, trim: true },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

ItemReportSchema.index({ itemId: 1 });
ItemReportSchema.index({ reporterEmail: 1 });

const ItemReport = models.ItemReport || model<IItemReport>("ItemReport", ItemReportSchema);

export default ItemReport;
