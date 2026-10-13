const express = require("express");

const mongoose = require("mongoose");

const multer = require("multer");

const { GridFSBucket } = require("mongodb");

const cors = require("cors");

require("dotenv").config();

const { SendEmail } = require("./.js");

let bucket;

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const app = express();

app.use(cors());

app.use(express.json());

console.log("mongo uri existed", !!process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("database connected successfully");

    bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "shoeimages",
    });

    console.log("bucket :");
  })
  .catch((error) => {
    console.log(error);
  });

// ==================== COLOR PALETTE ====================

const COLOR_PALETTE = [
  "BLACK",
  "WHITE",
  "RED",
  "NAVY",
  "ROYAL_BLUE",
  "GREY",
  "BEIGE",
  "BROWN",
  "GREEN",
  "OLIVE",
  "ORANGE",
  "YELLOW",
  "PINK",
  "PURPLE",
  "MAROON",
  "GOLD",
  "SILVER",
  "MULTICOLOR",
];

// ==================== SHOE SCHEMA ====================

let shoeschema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "comapny name is required"],
      uppercase: true,
    },

    shoename: {
      type: String,
      required: [true, "shoe name is required"],
      uppercase: true,
    },

    images: [
      {
        type: mongoose.Schema.Types.ObjectID,
      },
    ],

    colors: {
      type: [
        {
          type: String,
          enum: COLOR_PALETTE,
        },
      ],

      required: [true, "select at least one color"],

      validate: {
        validator: function (colors) {
          return Array.isArray(colors) && colors.length > 0;
        },

        message: "select at least one color",
      },
    },

    sizes: {
      type: [
        {
          size: {
            type: Number,
            required: [true, "size is required"],
            min: [1, "shoe size cant be negative or zero"],
          },

          stock: {
            type: Number,
            required: [true, "stock is required"],
            min: [0, "stock cant be negative"],
          },
        },
      ],

      required: [true, "add at least one size"],

      validate: {
        validator: function (sizes) {
          return Array.isArray(sizes) && sizes.length > 0;
        },

        message: "add at least one size",
      },

      _id: false,
    },

    price: {
      type: Number,
      required: true,

      validate: {
        validator: function (price) {
          return price > 0;
        },

        message: "price cant be zero or negative",
      },
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      uppercase: true,
      enum: ["MALE", "male", "FEMALE", "female", "UNISEX", "unisex"],
    },

    condition: {
      type: String,
      required: [true, "condition of the shoe id required"],
      uppercase: true,
      enum: ["USED", "used", "NEW", "new"],
    },
  },

  {
    strict: true,
    timestamps: true,
  },
);

const SHOEMODEL = mongoose.model("SHOESCHEMA", shoeschema);

// ==================== ASYNC HANDLER ====================

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== PARSE ARRAY ====================

function parseArrayField(rawValue, fieldName) {
  if (rawValue === undefined) return undefined;

  if (Array.isArray(rawValue)) return rawValue;

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    let parseerror = new Error(
      `${fieldName} must be valid JSON`,
    );

    parseerror.name = "ValidationError";

    throw parseerror;
  }
}

// ==================== CREATE SHOE ====================

app.post(
  "/shoes",

  upload.array("images"),

  asyncHandler(async (req, res, next) => {
    let existingone = await SHOEMODEL.findOne({
      company: req.body.company,
      shoename: req.body.shoename,
    });

    if (existingone) {
      return res.status(409).json({
        message: "Shoe already exists",
      });
    }

    console.log("post");

    let imageid = [];

    for (let i = 0; i < req.files.length; i++) {
      let uploadstream = bucket.openUploadStream(
        req.files[i].originalname,
      );

      await new Promise((resolve, reject) => {
        uploadstream.on("finish", () => {
          console.log("upload finish");
          resolve();
        });

        uploadstream.on("error", (error) => {
          console.log("some error occured");
          reject(error);
        });

        console.log("upload started");

        uploadstream.end(req.files[i].buffer);
      });

      imageid.push(uploadstream.id);
    }

    let newshoe = {
      company: req.body.company,
      shoename: req.body.shoename,
      price: req.body.price,
      gender: req.body.gender,
      condition: req.body.condition,
      colors: parseArrayField(req.body.colors, "colors"),
      sizes: parseArrayField(req.body.sizes, "sizes"),
      images: imageid,
    };

    let data = await SHOEMODEL.create(newshoe);

    res.status(201).json(data);
  }),
);

// ==================== GET SHOES ====================

app.get(
  "/shoes",

  asyncHandler(async (req, res, next) => {
    console.log("get shoes");

    let wholedata = await SHOEMODEL.find();

    res.json(wholedata);
  }),
);

// ==================== SEARCH SHOES ====================

app.get(
  "/shoes/search",

  asyncHandler(async (req, res) => {
    let data = await SHOEMODEL.find({
      company: req.query.company,
    });

    res.status(200).json(data);
  }),
);

// ==================== GET SINGLE SHOE ====================

app.get(
  "/shoes/:id",

  asyncHandler(async (req, res, next) => {
    console.log(req.params.id);

    let id = req.params.id;

    let iddata = await SHOEMODEL.findById(id);

    if (iddata == null) {
      return res.status(404).json({
        message: "shoe not found",
      });
    }

    res.json(iddata);
  }),
);

// ==================== DELETE SHOE ====================

app.delete(
  "/shoes/:id",

  asyncHandler(async (req, res, next) => {
    console.log("delete");

    let id = req.params.id;

    let deletedata = await SHOEMODEL.findById(id);

    if (deletedata == null) {
      return res.status(404).json({
        message: "Shoe not found",
      });
    }

    for (let i = 0; i < deletedata.images.length; i++) {
      let deleteid = deletedata.images[i];

      await bucket.delete(deleteid);
    }

    let deleted = await SHOEMODEL.findByIdAndDelete(id);

    res.json(deleted);
  }),
);

// ==================== GET IMAGE ====================

app.get(
  "/images/:id",

  asyncHandler(async (req, res) => {
    let imageid = new mongoose.Types.ObjectId(
      req.params.id,
    );

    let downloadstream = bucket.openDownloadStream(imageid);

    downloadstream.on("error", (error) => {
      res.status(404).send("image not found");
    });

    downloadstream.pipe(res);
  }),
);

// ==================== PATCH SHOE ====================

const EDITABLE_FIELDS = [
  "company",
  "shoename",
  "price",
  "gender",
  "condition",
];

app.patch(
  "/shoes/:id",

  upload.array("images"),

  asyncHandler(async (req, res, next) => {
    console.log("patch");

    let id = req.params.id;

    let oldshoe = await SHOEMODEL.findById(id);

    if (oldshoe == null) {
      return res.status(404).json({
        message: "Shoe not found",
      });
    }

    const updatewholedata = {};

    for (let i = 0; i < EDITABLE_FIELDS.length; i++) {
      let field = EDITABLE_FIELDS[i];

      if (req.body[field] !== undefined) {
        updatewholedata[field] = req.body[field];
      }
    }

    if (req.body.colors !== undefined) {
      updatewholedata.colors = parseArrayField(
        req.body.colors,
        "colors",
      );
    }

    if (req.body.sizes !== undefined) {
      updatewholedata.sizes = parseArrayField(
        req.body.sizes,
        "sizes",
      );
    }

    let imageid = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        let uploadstream = bucket.openUploadStream(
          req.files[i].originalname,
        );

        await new Promise((resolve, reject) => {
          uploadstream.on("finish", () => {
            resolve();
          });

          uploadstream.on("error", (error) => {
            reject(error);
          });

          uploadstream.end(req.files[i].buffer);
        });

        imageid.push(uploadstream.id);
      }

      updatewholedata.images = imageid;
    }

    let updateddata =
      await SHOEMODEL.findByIdAndUpdate(
        id,
        updatewholedata,
        {
          new: true,
          runValidators: true,
        },
      );

    if (updateddata == null) {
      return res.status(404).json({
        message: "Shoe not found",
      });
    }

    if (imageid.length > 0) {
      for (let i = 0; i < oldshoe.images.length; i++) {
        await bucket.delete(oldshoe.images[i]);
      }
    }

    res.send(updateddata);
  }),
);

// ==================== ORDER SCHEMA ====================

let orderschema = new mongoose.Schema(
  {
    customer: {
      name: {
        type: String,
        required: [true, "customer name is required"],
      },

      email: {
        type: String,
        required: [true, "email is required"],
      },

      phone: {
        type: String,
        required: [true, "phone number is required"],
      },

      address: {
        type: String,
        required: [true, "address is required"],
      },
    },

    items: {
      type: [
        {
          shoeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },

          company: String,

          shoename: String,

          color: {
            type: String,
            required: true,
          },

          size: {
            type: Number,
            required: true,
          },

          quantity: {
            type: Number,
            required: true,
            min: 1,
          },

          price: {
            type: Number,
            required: true,
          },
        },
      ],

      required: [
        true,
        "order must have at least one item",
      ],

      validate: {
        validator: function (items) {
          return (
            Array.isArray(items) &&
            items.length > 0
          );
        },

        message:
          "order must have at least one item",
      },
    },

    paymentMethod: {
      type: String,

      required: [
        true,
        "payment method is required",
      ],

      enum: [
        "EASYPAISA",
        "JAZZCASH",
        "CASH_ON_DELIVERY",
      ],
    },

    paymentStatus: {
      type: String,

      enum: [
        "PENDING",
        "PAID",
        "FAILED",
      ],

      default: "PENDING",
    },

    paymentReference: {
      type: String,
      required: false,
    },

    paymentProof: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    paymentSubmittedAt: {
      type: Date,
      required: false,
    },

    totalCost: {
      type: Number,
      required: true,
    },
  },

  {
    timestamps: true,
  },
);

const ORDERMODEL = mongoose.model(
  "ORDERSCHEMA",
  orderschema,
);

// ==================== PLACE ORDER ====================

console.log("registering orders route");

app.post(
  "/orders",

  asyncHandler(async (req, res, next) => {
    console.log(
      "order route is reached inside the app post ",
    );

    let {
      customer,
      items,
      paymentMethod,
    } = req.body;

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Your cart is empty",
      });
    }

    for (let i = 0; i < items.length; i++) {
      let item = items[i];

      let shoe =
        await SHOEMODEL.findById(item.shoeId);

      if (!shoe) {
        return res.status(404).json({
          message:
            "One of the shoes in your cart no longer exists",
        });
      }

      let sizeEntry = shoe.sizes.find(
        (s) => s.size === item.size,
      );

      if (
        !sizeEntry ||
        sizeEntry.stock < item.quantity
      ) {
        return res.status(409).json({
          message: `${shoe.shoename} (size ${item.size}) doesn't have enough stock left`,
        });
      }
    }

    // ==================== REDUCE STOCK ====================

    for (let i = 0; i < items.length; i++) {
      let item = items[i];

      await SHOEMODEL.updateOne(
        {
          _id: item.shoeId,
          "sizes.size": item.size,
        },

        {
          $inc: {
            "sizes.$.stock": -item.quantity,
          },
        },
      );
    }

    // ==================== TOTAL ====================

    let totalCost = items.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0,
    );

    // ==================== PAYMENT NUMBER ====================

    let paymentNumber = null;

    if (paymentMethod === "EASYPAISA") {
      paymentNumber =
        process.env.MY_EASYPAISA_NUMBER;
    }

    if (paymentMethod === "JAZZCASH") {
      paymentNumber =
        process.env.MY_JAZZCASH_NUMBER;
    }

    // ==================== CREATE ORDER ====================

    let order = await ORDERMODEL.create({
      customer,

      items,

      paymentMethod,

      paymentStatus: "PENDING",

      totalCost,
    });

    await SendEmail(order);

    // ==================== SEND ORDER + PAYMENT NUMBER ====================

    res.status(201).json({
      ...order.toObject(),

      paymentNumber,
    });
  }),
);

app.post(
  "/orders/:id/payment-proof",

  upload.single("paymentscreenshot"),

  asyncHandler(async (req, res, next) => {

    let orderId = req.params.id;

    let order = await ORDERMODEL.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "PENDING") {
      return res.status(409).json({
        message: "This order payment has already been processed",
      });
    }

    // ==================== OPTIONAL SCREENSHOT ====================

    if (req.file) {

      let uploadstream = bucket.openUploadStream(
        req.file.originalname,
      );

      await new Promise((resolve, reject) => {

        uploadstream.on("finish", () => {
          resolve();
        });

        uploadstream.on("error", (error) => {
          reject(error);
        });

        uploadstream.end(req.file.buffer);
      });

      order.paymentProof = uploadstream.id;
    }

    // ==================== PAYMENT SUBMITTED ====================

    order.paymentSubmittedAt = new Date();

    // Payment is NOT verified yet.
    // Admin will manually change it to PAID later.

    order.paymentStatus = "PENDING";

    await order.save();

    res.status(200).json({
      message:
        "Payment submitted successfully. Your payment is pending verification.",
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      paymentProof: order.paymentProof || null,
      paymentSubmittedAt: order.paymentSubmittedAt,
    });
  }),
);
// ==================== 404 ====================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ==================== ERROR HANDLER ====================

app.use((error, req, res, next) => {
  console.log(
    "the middleware finuction has beens uesed:",
  );

  console.log(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "validation failed",
      error: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID",
      error: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value",
      error: error.message,
    });
  }

  res.status(500).json({
    message: "something went wrong",
    error: error.message,
  });
});

// ==================== SERVER ====================

app.listen(3000, () => {
  console.log(
    "the server is listning on port 3000",
  );
});