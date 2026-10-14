import { User } from '../models/User.js';
import { StudyGroup } from '../models/StudyGroup.js';
import { StudySession } from '../models/StudySession.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const groupsJoined = await StudyGroup.countDocuments({ 'members.user': user._id });
    const groupsCreated = await StudyGroup.countDocuments({ creator: user._id });
    const sessionsOrganized = await StudySession.countDocuments({ organizer: user._id });
    const materialsUploaded = await StudyMaterial.countDocuments({ uploader: user._id });

    res.status(200).json({
      success: true,
      user,
      stats: {
        groupsJoined,
        groupsCreated,
        sessionsOrganized,
        materialsUploaded,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, department, semester, college, registrationNumber, bio } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(department && { department }),
        ...(semester && { semester }),
        ...(college !== undefined && { college }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(bio !== undefined && { bio }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      settings: user.settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.settings = {
      ...user.settings,
      ...req.body,
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Settings saved successfully.',
      settings: user.settings,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Remove user from all study groups
    await StudyGroup.updateMany(
      { 'members.user': userId },
      { $pull: { members: { user: userId } } }
    );

    // Delete groups created by this user
    await StudyGroup.deleteMany({ creator: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
