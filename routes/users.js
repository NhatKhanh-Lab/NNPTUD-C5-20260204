var express = require("express");
var router = express.Router();
let { validatedResult, CreateUserValidator, ModifyUserValidator } = require("../utils/validator")
let userModel = require("../schemas/users");
let userController = require("../controllers/users");
let roleModel = require("../schemas/roles");
let cartModel = require("../schemas/carts");
const { checkLogin,checkRole } = require("../utils/authHandler");
let ExcelJS = require("exceljs");
let crypto = require("crypto");
let { sendUserPasswordMail } = require("../utils/mailHandler");

function getCellValue(cell) {
  if (!cell) {
    return "";
  }

  if (typeof cell === "object" && cell !== null) {
    if (cell.text) {
      return String(cell.text).trim();
    }
    if (cell.result) {
      return String(cell.result).trim();
    }
  }

  return String(cell).trim();
}

function generateRandomPassword() {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = lowercase + uppercase + digits + symbols;

  let password = [
    lowercase[crypto.randomInt(lowercase.length)],
    uppercase[crypto.randomInt(uppercase.length)],
    digits[crypto.randomInt(digits.length)],
    symbols[crypto.randomInt(symbols.length)],
  ];

  while (password.length < 16) {
    password.push(allChars[crypto.randomInt(allChars.length)]);
  }

  for (let i = password.length - 1; i > 0; i--) {
    let swapIndex = crypto.randomInt(i + 1);
    let temp = password[i];
    password[i] = password[swapIndex];
    password[swapIndex] = temp;
  }

  return password.join("");
}

async function findOrCreateUserRole() {
  let userRole = await roleModel.findOne({
    name: { $regex: /^USER$/i },
    isDeleted: false
  });

  if (!userRole) {
    userRole = new roleModel({
      name: "USER",
      description: "Default role for imported users"
    });
    await userRole.save();
  }

  return userRole;
}


router.get("/", checkLogin,checkRole("ADMIN","MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email,
      req.body.role, req.body.fullname, req.body.avatarUrl
    )
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post("/import", async function (req, res, next) {
  const filePath = req.body.filePath || "C:\\Users\\admin\\Downloads\\user.xlsx";

  try {
    let workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    let worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).send({ message: "Khong tim thay worksheet trong file Excel" });
    }

    let headerRow = worksheet.getRow(1);
    let usernameHeader = getCellValue(headerRow.getCell(1)).toLowerCase();
    let emailHeader = getCellValue(headerRow.getCell(2)).toLowerCase();

    if (usernameHeader !== "username" || emailHeader !== "email") {
      return res.status(400).send({ message: "File Excel phai co 2 cot username, email" });
    }

    let imported = [];
    let skipped = [];
    let mailFailed = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      let row = worksheet.getRow(rowNumber);
      let username = getCellValue(row.getCell(1).value);
      let email = getCellValue(row.getCell(2).value);

      if (!username && !email) {
        continue;
      }

      if (!username || !email) {
        skipped.push({
          row: rowNumber,
          username: username,
          email: email,
          reason: "Thieu username hoac email"
        });
        continue;
      }

      let existingUser = await userModel.findOne({
        $or: [{ username: username }, { email: email }],
        isDeleted: false
      });

      if (existingUser) {
        skipped.push({
          row: rowNumber,
          username: username,
          email: email,
          reason: "Username hoac email da ton tai"
        });
        continue;
      }

      let password = generateRandomPassword();
      let newUser = null;
      let newCart = null;

      try {
        let userRole = await findOrCreateUserRole();
        newUser = new userModel({
          username: username,
          email: email,
          password: password,
          role: userRole._id
        });
        await newUser.save();

        newCart = new cartModel({
          user: newUser._id
        });
        await newCart.save();

        try {
          await sendUserPasswordMail(email, username, password);
        } catch (mailError) {
          mailFailed.push({
            row: rowNumber,
            username: username,
            email: email,
            reason: "Tao user thanh cong nhung gui mail that bai: " + mailError.message
          });
        }

        imported.push({
          row: rowNumber,
          username: username,
          email: email
        });
      } catch (error) {
        if (newCart && newCart._id) {
          await cartModel.deleteOne({ _id: newCart._id });
        }
        if (newUser && newUser._id) {
          await userModel.deleteOne({ _id: newUser._id });
        }
        skipped.push({
          row: rowNumber,
          username: username,
          email: email,
          reason: error.message
        });
      }
    }

    res.send({
      filePath: filePath,
      totalRows: worksheet.rowCount - 1,
      importedCount: imported.length,
      skippedCount: skipped.length,
      mailFailedCount: mailFailed.length,
      imported: imported,
      skipped: skipped,
      mailFailed: mailFailed
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.put("/:id", ModifyUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
