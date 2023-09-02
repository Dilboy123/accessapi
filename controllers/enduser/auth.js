const EndUser = require("../../models/EndUser");
const ObjectId = require("mongodb").ObjectId;

const authController = {};

authController.register = async (req, res) => {
  try {
    const newUser = new EndUser(req.body);
    console.log(req.body, newUser);
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

authController.login = async (req, res) => {
  try {
    const { UserName, Password } = req.body;

    console.log(req.body);

    const user = await EndUser.findOne({ UserName: req.body.UserName });

    let loginAttempt = {
      ip: req.body.ip,
      location: req.body.location,
      uuid: req.body.uuid,
      datetime: new Date(),
      isSuccessful: false,
    };

    if (user != null) {
      const isPasswordValid = await user.comparePassword(Password);
      loginAttempt.isSuccessful = isPasswordValid;

      if (!isPasswordValid) {
        await handleAbnormalLogin(user, req);
        return res
          .status(401)
          .json({ message: "Authentication failed : invalid password" });
      }

      if (user.logindetails == null) user.logindetails = [];

      console.log(loginAttempt);
      user.logindetails.push(loginAttempt);
      await user.save();

      if (user && user.isBlocked) {
        await handleAbnormalLogin(user, req);
        return res
          .status(403)
          .json({ message: "User blocked due to abnormal behavior." });
      }
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "Authentication failed, user not found" });
    }

    const token = user.generateAuthToken();
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.getDevices = async (req, res) => {
  try {
    const user = await EndUser.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ devices: user.devices });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
authController.addDevice = async (req, res) => {
  try {
    const {
      userId,
      uuid,
      devicename,
      devicelocation,
      latitude,
      longitude,
      publicip,
    } = req.body.device;
    const user = await EndUser.findOne({ _id: new ObjectId(userId) });
    console.log(req.body, user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.devices.push({
      uuid,
      devicename,
      devicelocation,
      latitude,
      longitude,
      publicip,
    });
    await user.save();

    res.json({ message: "Device added successfully", user: user });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

authController.addLoginDetail = async (req, res) => {
  try {
    const user = await EndUser.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { ip, location, uuid } = req.body;
    user.logindetails.push({ ip, location, uuid });
    await user.save();

    res.json({ message: "Login detail added successfully", user: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.viewLoginLogs = async (req, res) => {
  try {
    const user = await EndUser.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ logindetails: user.logindetails });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.viewAbnormalLogs = async (req, res) => {
  try {
    const user = await EndUser.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ abnormalLogins: user.abnormalLogins });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.viewAllLoginLogs = async (req, res) => {
  try {
    const allUsers = await EndUser.find({}, "UserName logindetails");
    res.json(allUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.viewAllAbnormalLogs = async (req, res) => {
  try {
    const allUsers = await EndUser.find({}, "UserName abnormalLogins");
    res.json(allUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.addServerAuth = async (req, res) => {
  try {
    const { userId, servertype, ip, port, username, password, alloweduuid } =
      req.body;

    console.log(req.body);
    const user = await EndUser.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.serverauths.push({
      servertype,
      ip,
      port,
      username,
      password,
      alloweduuid,
    });
    await user.save();

    res.json({
      message: "Server authentication added successfully",
      user: user,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
};

authController.getServerAuths = async (req, res) => {
  try {
    const user = await EndUser.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ serverauths: user.serverauths });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.updateServerAuth = async (req, res) => {
  try {
    const {
      userId,
      serverIndex,
      servertype,
      ip,
      port,
      username,
      password,
      alloweduuid,
    } = req.body;
    const user = await EndUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (serverIndex >= 0 && serverIndex < user.serverauths.length) {
      user.serverauths[serverIndex] = {
        servertype,
        ip,
        port,
        username,
        password,
        alloweduuid,
      };

      await user.save();

      res.json({
        message: "Server authentication updated successfully",
        user: user,
      });
    } else {
      res.status(400).json({ message: "Invalid server index" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.blockUser = async (req, res) => {
  try {
    const user = await EndUser.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = true;
    await user.save();

    res.json({ message: "User blocked successfully", user: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.unblockUser = async (req, res) => {
  try {
    const user = await EndUser.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBlocked = false;
    await user.save();

    res.json({ message: "User unblocked successfully", user: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.getUsers = async (req, res) => {
  try {
    const user = await EndUser.find();
    if (!user) {
      return res.status(404).json({ message: "Users not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.getUserInfo = async (req, res) => {
  try {
    const user = await EndUser.findOne({ UserName: req.params.userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

authController.editDevice = async (req, res) => {
  try {
    const { userId, deviceIndex, uuid, devicename, devicelocation, publicip } =
      req.body;
    const user = await EndUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (deviceIndex >= 0 && deviceIndex < user.devices.length) {
      user.devices[deviceIndex] = {
        uuid,
        devicename,
        devicelocation,
        publicip,
      };

      await user.save();

      res.json({
        message: "Device information updated successfully",
        user: user,
      });
    } else {
      res.status(400).json({ message: "Invalid device index" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Handle abnormal login attempts
const handleAbnormalLogin = async (user, req) => {
  const abnormalLogin = user.abnormalLogins.find(
    (entry) => entry.ip === req.ip
  );

  if (abnormalLogin) {
    abnormalLogin.loginAttempts += 1;
    abnormalLogin.lastLogin = new Date();
  } else {
    user.abnormalLogins.push({
      ip: req.ip,
      location: req.body.location,
      uuid: req.body.uuid,
      loginAttempts: 1,
      lastLogin: new Date(),
    });
  }

  await user.save();

  if (abnormalLogin && abnormalLogin.loginAttempts >= 3) {
    user.isBlocked = true;
    await user.save();
  }
};

module.exports = authController;
