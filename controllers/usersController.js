const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

//@desc get all users
//@route GET /users
//@access private
const getAllUsers = asyncHandler(async (req, res) => {
  //Get all users from MongoDB
  const users = await User.find().select("-password").lean();

  //If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  res.json(users);
});

//@desc create a user
//@route POST /users
//@access private
const createUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  //Confirm the data
  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  //Check for duplicates
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Username already exists" });
  }

  //Hash password
  const hashedPass = await bcrypt.hash(password, 10); //10 salt rounds

  //Create user object with hashed password
  const userObject =
    !Array.isArray(roles) || !roles.length
      ? { username, password: hashedPass }
      : { username, password: hashedPass, roles };

  //Create and store the new user
  const user = await User.create(userObject);

  if (user) {
    //user created successfully
    res
      .status(201)
      .json({ message: `New user ${username} created successfully` });
  } else {
    res.status(400).json({ message: "Received invalid user data" });
  }
});

//@desc update a user
//@route PATCH /users
//@access private
const updateUser = asyncHandler(async (req, res) => {
  const { username, id, roles, active, password } = req.body;

  //Confirm the data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  //Check if the user exists
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //Check for duplicate username
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  //Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Username already exists" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    //Hash Password
    user.password = await bcrypt.hash(password, 10); //10 salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `User ${updatedUser.username} updated` });
});

//@desc delete a user
//@route DELETE /users
//@access private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID is required!" });
  }

  const note = await Note.findOne({ user: id }).lean().exec();

  if (note) {
    return res
      .status(400)
      .json({ message: "User has notes assigned to them!" });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found!" });
  }

  const result = await user.deleteOne();

  const reply = `User: ${result.username} with ID: ${result.id} has been deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
