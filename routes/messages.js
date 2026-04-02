const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const messageModel = require("../schemas/messages");
const userModel = require("../schemas/users");
const { checkLogin } = require("../utils/authHandler");

const userPopulate = {
  path: "from to",
  select: "username email fullName avatarUrl"
};

function normalizeMessageBody(body) {
  const messageContent = body.messageContent || {};
  const type = messageContent.type || body.type;
  const text = messageContent.text || body.text;

  return {
    to: body.to,
    type: typeof type === "string" ? type.trim().toLowerCase() : "",
    text: typeof text === "string" ? text.trim() : ""
  };
}

router.get("/", checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;

    const messages = await messageModel.aggregate([
      {
        $match: {
          $or: [
            { from: currentUserId },
            { to: currentUserId }
          ]
        }
      },
      {
        $addFields: {
          conversationUser: {
            $cond: [
              { $eq: ["$from", currentUserId] },
              "$to",
              "$from"
            ]
          }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $group: {
          _id: "$conversationUser",
          message: {
            $first: "$$ROOT"
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: "$message"
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ]);

    const populatedMessages = await messageModel.populate(messages, userPopulate);
    res.send(populatedMessages);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get("/:userID", checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userID;

    if (!mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).send({ message: "userID khong hop le" });
    }

    const messages = await messageModel
      .find({
        $or: [
          { from: currentUserId, to: otherUserId },
          { from: otherUserId, to: currentUserId }
        ]
      })
      .sort({ createdAt: 1 })
      .populate(userPopulate);

    res.send(messages);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/", checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;
    const { to, type, text } = normalizeMessageBody(req.body);

    if (!mongoose.isValidObjectId(to)) {
      return res.status(400).send({ message: "to khong hop le" });
    }

    if (!["file", "text"].includes(type)) {
      return res.status(400).send({ message: "type phai la file hoac text" });
    }

    if (!text) {
      return res.status(400).send({ message: "text khong duoc de trong" });
    }

    const receiver = await userModel.findOne({
      _id: to,
      isDeleted: false
    });

    if (!receiver) {
      return res.status(404).send({ message: "user nhan khong ton tai" });
    }

    const newMessage = new messageModel({
      from: currentUserId,
      to: to,
      messageContent: {
        type: type,
        text: text
      }
    });

    await newMessage.save();
    await newMessage.populate(userPopulate);

    res.send(newMessage);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
